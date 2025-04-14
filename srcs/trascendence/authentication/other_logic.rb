require 'json'
require 'pg'
require 'colorize'
require 'logger'
require 'rack'
require_relative ((File.file?('/var/common/Ports.rb') ? '/var/common/Ports.rb' : '../../common_tools/tools/Ports.rb'))

module Other_logic

  def callback(request, response, client)
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
    response.content_type = 'application/json'
    response.write({ success: true , message: "authenticated"}.to_json)
    response.finish
  end

  def get_user_data_from_oauth_provider(token)
    uri = URI("https://api.intra.42.fr/v2/me")
    request = Net::HTTP::Get.new(uri)
    request["Authorization"] = "Bearer #{token}"

    response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
      http.request(request)
    end
    if response.code.to_i == 200
      user_data = JSON.parse(response.body)
    else
      puts "Errore API 42: #{response.code}"
      return nil
    end
    realname = ERB::Util.html_escape(user_data['usual_full_name'])
    email = ERB::Util.html_escape(user_data['email'])
    image = ERB::Util.html_escape(user_data['image']['link'])
    display_name = ERB::Util.html_escape(user_data['login'])
    payload = {
      data: {
        realname: realname,
        email: email,
        image: image,
        display_name: display_name
      },
      do_create: true
    }
    SimpleServer.method_req("login_user", payload)
  end
end