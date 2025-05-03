require 'socket'
require 'timeout'
require 'webrick/websocket'

require_relative 'chat_store'

load(File.file?('/var/common/Ports.rb') ? '/var/common/Ports.rb' : '../common_tools/tools/Ports.rb')

load(File.file?('/var/common/RequestUnpacker.rb') ? '/var/common/RequestUnpacker.rb' : '../common_tools/tools/RequestUnpacker.rb')

$stdout.sync = true
SERVICE_NAME = 'chat'
SERVICE_NAME_1 = 'internal_chat_support'
PORT = PortFinder::FindPort.new(SERVICE_NAME).getPort
PORT_1 = PortFinder::FindPort.new(SERVICE_NAME_1).getPort
server = WEBrick::Websocket::HTTPServer.new(Port: PORT, DocumentRoot: File.dirname(__FILE__))

class ChatService < WEBrick::Websocket::Servlet
  def socket_open(sock)
    puts 'Socket created'
  end

  def socket_close(sock)
    ChatStore.close_client(@username) if @username
    puts "#{@username} left the chat, loggin out..."
    SimpleServer::method_req('logout_user', {'display_name' => @username, 'token' => @token}) if @token && @username
  end
  
  def socket_text(sock, text)
    begin
      data = JSON.parse text
        puts "####", text
      puts "request: #{data['type'].to_s}"

      return sock.close if data['username'].to_s == 'default'

      target = data["to"].to_s

      case data["type"].to_s
      when "join"
        @username = data["username"].to_s
        if ChatStore.exists? @username
          sock.puts({'status' => 'another user with the same username is already connected', 'succes' => 'false', 'type' => 'kick'}.to_json)
          socket_close(sock)
          return
        end
        @token = data["token"].to_s
        ChatStore.joined @username, sock
        ChatStore.sys_broadcast "#{@username} joined the chat!", @username
        puts "joined: #{@username}"
      when "send_message"
        message = {
          "date"    => Time.now.iso8601,
          "from"    => @username,
          "content" => data["content"].to_s
        }
        if data["chat"].to_s == "general"
          message['to'] = 'general'
          ChatStore.broadcast message, 'message'

        elsif data["chat"].to_s == "private"
          unless ChatStore.clients[@username].friends.include? target
            return ChatStore.clients[@username].send_sys "The message could not be delivered" 
          end
          message["to"] = target.to_s
          ChatStore.clients[target].send_me message, 'private_message'
          ChatStore.clients[@username].send_me message, 'private_message'
        end

      when "friend_request"
        ChatStore.friend_req target, @username

      when "friend_response"
        #in this case target is whoever was @username who sent the request
        ChatStore.friend_res target, @username, data['accepted'].to_s

      when "remove_friend"
        ChatStore.remove_friend target, @username

      when "private_chat_started"
        ChatStore.start_private_chat target, @username

      when "block_user"
        ChatStore.block target, @username

      when "unblock_user"
        ChatStore.clients[@username].send_sys "You have unblocked #{target}"
        ChatStore.clients[@username].unblock_user target
        ChatStore.clients[target].send_me({ 'from' => @username }, 'unblock_user')

      when 'match_request'
        ChatStore.clients[data['to'].to_s].send_me({'from' => @username, 'data' => data['data']}, "match_request")

      when 'match_response'
        ChatStore.clients[data['to'].to_s].send_me({'from' => @username, 'accepted' => data['accepted'].to_s}, "match_response")
        if data['accepted'].to_s == ' true'
          
        end

      when 'get_online_users'
        ChatStore.clients[@username].send_me({'users' => ChatStore.clients.filter{|c| c.alive?}}, 'online_users_list')

      when 'get_state'
        ChatStore.get_client_state(@username)

      else
        puts "Unknown message type: #{data["type"]}"
      end
    # rescue => e
    #   puts "Error handling message: #{e.message}"
    end
  end
end

server.mount('/', ChatService)

def internal_call(client, server)
  puts "internal call called"
  t = select [client], [], [], 20 # waits for client, a few seconds
  return if t.nil? || t[0].empty? || client.closed?

  msg = client.read_nonblock Ports::MAX_MSG_LEN
  # bobj = JSON.parse(msg)
  bobj = RequestUnpacker::Unpacker.new.unpack msg

  r = nil
  case bobj['method']
  when 'broadcast'
    puts "Broadcast called from non client"
    ChatStore.sys_broadcast bobj['content'] if bobj['content'] rescue r
    client.puts
  when 'send_msg'
    puts "Sending message to #{bobj['to']}: #{bobj['content']}"
    r = "missing params" unless (['content', 'to'] - bobj.keys).empty?
    ChatStore.clients[bobj['to']].send_me({'date' => Time.now.iso8601, 'from' => 'sys', 'content' => bobj['content']}, bobj['type'] ? bobj['type'] : 'message') rescue r
    client.puts
  when 'get_online'
    client.puts ChatStore.get_online(bobj['include_guests']).to_json
  when 'is_online'
    puts "Is #{bobj['username']} online? Online users: "
    found = ChatStore.exists? bobj['username'].to_s
    client.puts({'status' => (found ? 'success' : 'no user found'), 'success' => found}.to_json)
  else
    puts "Unknown method called (#{bobj['method']})"
  end
  puts r if r
end

puts 'Starting internal_chat_support at port ' + PORT_1.to_s + '!'

Thread.start{(SimpleServer::SimplerTCP.new PORT_1, :internal_call).start_loop}

server.start
