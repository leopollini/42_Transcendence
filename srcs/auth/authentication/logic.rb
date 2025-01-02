require 'net/http'
require 'uri'
require 'json'
require 'cgi'
require_relative 'other_logic'

module AuthMethods
  def login(request, response, client)
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
    code = request.params['code']
    if code.nil? || code.empty?
      response.content_type = 'application/json'
      response.write({ success: false, error: "No authorization code received" }.to_json)
      return
    end
  
    token = client.get_token(code)
    
    response.set_cookie('access_token', {
      value: token.token,
      path: '/',
      max_age: 3600,
      secure: true,    # Solo su HTTPS
      httponly: true   # Non accessibile tramite JavaScript
    })
    
    request.session[:authenticated] = true
  
    user_data = get_user_data_from_oauth_provider(token.token)
  
    if user_data.nil? || user_data.empty?
      response.content_type = 'application/json'
      response.write({ success: false, error: "Failed to fetch user data" }.to_json)
      return
    end

    name = CGI.escapeHTML(user_data['name'])
    email = CGI.escapeHTML(user_data['email'])
    image = CGI.escapeHTML(user_data['avatar_url'])
    
  
    html_content = File.read('../login_module/auth_page.html')
  
    response.content_type = 'text/html'
    response.write(html_content)
  end 
end