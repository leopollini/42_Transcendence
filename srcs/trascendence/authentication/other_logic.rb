require 'json'
require 'pg'
require 'colorize'
require 'logger'

require_relative ((File.file?('/var/common/Ports.rb') ? '/var/common/Ports.rb' : '../../common_tools/tools/Ports.rb'))

module Other_logic

  def page_not_found(response)
    response.status = 200
    html_content = File.read('./pages_auth/no_page.html')
    response.content_type = 'text/html  '
    response.write(html_content)
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
    puts "adding token cookie"
    response.body = SimpleServer.method_req("login_user", payload)
    puts response
    data = JSON.parse(response)
    if data["token"]
      token = data["token"]
      
      cookie = WEBrick::Cookie.new("logged_token", token)
      
      cookie.secure = true 
      cookie.http_only = true
      cookie.same_site = 'Strict'

      res.cookies << cookie
    end
  end
end