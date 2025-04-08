require 'rack'
require 'json'
require 'oauth2'
require 'rack'
require 'colorize'
require 'rack/session/cookie'
require 'securerandom'
require_relative 'Oauth'
require_relative 'logic'
require_relative 'other_logic'
require 'dotenv'

Dotenv.load

class App
  include AuthMethods
  include Other_logic
  
  def initialize(client, logger)
    @client = client
    @logger = logger
    @spa_route = JSON.parse(ENV['SPA_ROUTES'] || '[]')
    @app = Rack::Builder.new do
      use Rack::Session::Cookie, 
          secret: ENV['SECRET_PASSWORD'] || SecureRandom.hex(64), 
          httponly: true, 
          secure: true, 
          same_site: 'strict'

      run self
    end
  end

  def call(env)
    request = Rack::Request.new(env)
    response = Rack::Response.new
    begin
      case request.path
      when '/'
        response.write(File.read(File.join(__dir__, '../public', 'index.html')))
        response.content_type = 'text/html'
      when '/auth/login'
        login(request, response, @client)
      when '/callback'
        callback(request, response, @client)
      else
        if File.extname(request.path).empty? && @spa_route.include?(request.path)
          response.write(File.read(File.join(__dir__, '../public', 'index.html')))
          response.content_type = 'text/html'
        elsif request.path.start_with?('/website') && static_file_path = File.exist?(File.join(__dir__, '../public', request.path))
          response.write(File.read(static_file_path))
          response.content_type = determine_content_type(request.path)
        else
          page_not_found(response)
        end
      end
    rescue => e
      puts "Error found: #{e.message}".red
      puts "Backtrace: #{e.backtrace.join("\n")}".red
    end

    response.finish
  end

  private

  def determine_content_type(path)
    case File.extname(path)
    when '.css' then 'text/css'
    when '.js' then 'application/javascript'
    when '.ico' then 'image/x-icon'
    else 'application/octet-stream'
    end
  end
end
