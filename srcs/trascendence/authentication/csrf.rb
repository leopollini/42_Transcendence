require 'colorize'
class CsrfMiddleware
    def initialize(app)
      @app = app
    end
  
    def call(env)
      request = Rack::Request.new(env) 
      if request.session[:csrf_token].nil?
        puts "generating csrf token".yellow
        request.session[:csrf_token] = generate_csrf_token
      end
  
      @app.call(env)
    end
  
    private
  
    def generate_csrf_token
      SecureRandom.hex(32)
    end
  end
  