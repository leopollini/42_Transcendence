require 'rack'
require 'json'
require 'oauth2'
require 'rack'
require 'colorize'
require 'rack/session/cookie'
require 'securerandom'
require_relative 'Oauth'
require_relative 'other_logic'
require 'dotenv'

Dotenv.load

class App
  include Other_logic
  
  def initialize(client, logger)
    @client = OAuthClient.new
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
      when '/api/callback'
        callback(request, response, @client)
      when '/callback'
        response.write(File.read(File.join(__dir__, '../public', 'index.html')))
        response.content_type = 'text/html'
      else
        if File.extname(request.path).empty? && @spa_route.include?(request.path)
          response.write(File.read(File.join(__dir__, '../public', 'index.html')))
          response.content_type = 'text/html'
        elsif File.exist?(File.join(__dir__, '../public', request.path))
          static_file_path = File.join(__dir__, '../public', request.path)
          response.write(File.read(static_file_path))
          response.content_type = determine_content_type(request.path)
        else
          response.write(File.read(File.join(__dir__, '../public', 'index.html')))
          response.content_type = 'text/html'
        end
      end
      
    rescue => e
      puts "Error found: #{e.message}".red
      puts "Backtrace: #{e.backtrace.join("\n")}".red
      response.content_type = 'application/json'
      response.write({ success: false, error: "Error in server" }.to_json)
      response.finish
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
