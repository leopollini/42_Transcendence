require 'socket'
require 'timeout'
require 'webrick/websocket'

require_relative 'chat_store'

load(File.file?('/var/common/Ports.rb') ? '/var/common/Ports.rb' : '../common_tools/tools/Ports.rb')

load(File.file?('/var/common/RequestUnpacker.rb') ? '/var/common/RequestUnpacker.rb' : '../common_tools/tools/RequestUnpacker.rb')

$stdout.sync = true
SERVICE_NAME = 'chat'
PORT = PortFinder::FindPort.new(SERVICE_NAME).getPort
server = WEBrick::Websocket::HTTPServer.new(Port: PORT, DocumentRoot: File.dirname(__FILE__))

class ChatService < WEBrick::Websocket::Servlet
  # def socket_open(sock)
  #   # optional
  #   sock.puts 'Welcome' # send a text frame
  # end
  
# message = {
#     "date"    => Time.now.iso8601,
#     "from"    => @username,
#     "to"      => (data["chat"] == "general" ? "general" : data["to"].to_s.downcase),
#     "content" => data["content"]
# }

  def socket_close(sock)
    ChatStore.remove_client(@username, sock) if @username
    puts "#{@username} left the chat"
  end
  
  def socket_text(sock, text)
    begin
      data = JSON.parse text
        puts "####", text
      puts "request: #{data['type']}"

      target = data["to"].to_s

      case data["type"]
      when "join"
        @username = data["username"].to_s
        ChatStore.joined @username, sock
        ChatStore.sys_broadcast "#{@username} joined the chat!", @username
        puts "joined: #{@username}"
      when "send_message"
        message = {
          "date"    => Time.now.iso8601,
          "from"    => @username,
          "content" => data["content"]
        }
        if data["chat"] == "general"
          message['to'] = 'general'
          ChatStore.broadcast message, 'message'

        elsif data["chat"] == "private"
          message["to"] = target
          ChatStore.clietns[target].send_me message
        end

      when "friend_request"
        ChatStore.friend_req target, @username

      when "friend_response"
        #in this case target is whoever was @username who sent the request
        ChatStore.friend_res target, @username, data['accepted']

      when "remove_friend"
        @@clients[target].send_me({"from" => @username}, 'friend_removed')
        @@clients[@username].send_me({"from" => target}, 'friend_removed')

      when "private_chat_started"
        @@clients[target].send_me({"from" => @username}, 'private_chat_started')

      when "block_user"
         

      when "unblock_user"
    

      else
        puts "Unknown message type: #{data["type"]}"
      end
    # rescue => e
    #   puts "Error handling message: #{e.message}"
    end
  end
end

server.mount('/', ChatService)

server.start
