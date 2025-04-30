require 'json'
require 'pg'
require 'colorize'
require 'logger'
require 'rack'
require 'securerandom'
require_relative ((File.file?('/var/common/Ports.rb') ? '/var/common/Ports.rb' : '../../common_tools/tools/Ports.rb'))

module Other_logic

  def callback(request, response, client)
    code = request.params['code']
    if code.nil? || code.empty?
      return json_error(response, "No authorization code received")
    end

    puts "code = #{code}".green

    token = client.get_token(code)

    if token.nil? || token.token.nil?
      return json_error(response, "Failed to retrieve access token")
    end
  
    request.session[:authenticated] = true
    request.session[:token] = token.token

    res = get_user_data_from_oauth_provider(token.token)
    user = res['user']
    puts "result: #{user}".yellow
    # realname = user['realname']
  
    response.content_type = 'application/json'
    response.write({
      success: res['success'].to_s,
      message: (res['success'] == "true" ? "!!Authenticated Succesfully!!" : res[]),
      token: token.token,
    }.merge(user).to_json)
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
        display_name: display_name,
        token: token
      },
      do_create: true
    }
    JSON.parse(SimpleServer.method_req("login_user", payload))
  end

  def login(request, response, client)
    request.session.clear
    auth_url = client.auth_url
    response.content_type = 'application/json'
    response.write({ auth_url: auth_url }.to_json)
  end
  
  def json_error(response, msg)
    response.content_type = 'application/json'
    response.write({ success: false, error: msg }.to_json)
    response.finish
  end

end