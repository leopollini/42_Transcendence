require 'net/http'
require 'uri'
require 'json'
require 'cgi'
require 'colorize'
require_relative 'other_logic'

module AuthMethods
  def login(request, response, client)
    request.session.clear
    if request.session[:access_token]
      response.content_type = 'application/json'
      response.write({ authenticated: true }.to_json)
    else
      auth_url = client.auth_url
      response.content_type = 'application/json'
      response.write({ auth_url: auth_url }.to_json)
    end
  end
  
  def callback(request, response, client)
    begin
      code = request.params['code']
      if code.nil? || code.empty?
        response.content_type = 'application/json'
        response.write({ success: false, error: "No authorization code received" }.to_json)
        return
      end
      token = client.get_token(code)

      if token.nil? || token.token.nil?
        response.content_type = 'application/json'
        response.write({ success: false, error: "Failed to retrieve access token" }.to_json)
        return
      end

      response.set_cookie('access_token', {
        value: token.token,
        path: '/',
        max_age: 3600,
        secure: true,
        httponly: true,
        same_site: 'Strict'
      })
      
      request.session[:user_agent] = request.user_agent
      request.session[:ip_address] = request.ip

      if request.session[:user_agent] != request.user_agent || request.session[:ip_address] != request.ip
        request.session.clear
        response.write("Session expired due to suspicious activity.")
        return response.finish
      end
      request.session[:authenticated] = true
      request.session[:token] = token.token

      get_user_data_from_oauth_provider(token.token)

      html_content = File.read('./pages_auth/auth_page.html')
      response.content_type = 'text/html'
      response.write(html_content)
    rescue StandardError => e
      response.content_type = 'application/json'
      response.write({ success: false, error: "Error during OAuth callback: #{e.message}" }.to_json)
    end
  end
end