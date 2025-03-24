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
  
  def socket_close(sock)
    ChatStore.remove_client(@username, sock) if @username
    puts "#{@username} left the chat"
  end
  
  def socket_text(sock, text)
    puts "####", text
    begin
      data = JSON.parse text
      puts "request: #{data['type']}"
      case data["type"]
      when "join"
        @username = data["@username"].to_s.downcase
        
        puts "#{@username} joined the chat!"
      when "send_message"
        message = {
          "date"    => Time.now.iso8601,
          "from"    => @username,
          "to"      => (data["chat"] == "general" ? "general" : data["to"].to_s.downcase),
          "content" => data["content"]
        }

        if data["chat"] == "general"
          ChatStore.add_general_message(message)
          ChatStore.mutex.synchronize do
            ChatStore.clients.each_value do |sockets|
              sockets.send({ "type" => "message", "data" => message }.to_json)
            end
          end
        elsif data["chat"] == "private"
          target = data["to"].to_s.downcase
          # Il messaggio viene inoltrato solo se i due utenti sono amici
          if !ChatStore.friends?(@username, target)
            sock.send({ "type" => "system", "data" => { "content" => "The message could not be delivered." } }.to_json)
          else
            delivered = false
            ChatStore.mutex.synchronize do
              if ChatStore.clients.key?(target) && !ChatStore.clients[target].empty?
                ChatStore.clients[target].send({ "type" => "private_message", "data" => message }.to_json)
                delivered = true
              end
            end
            sock.send({ "type" => "private_message", "data" => message }.to_json)
            ChatStore.add_offline_message(target, { type: "private_message", data: message }) unless delivered
          end
        end

      when "friend_request"
        target = data["to"].to_s.downcase
        if ChatStore.blocked?(target, @username)
          sock.send({
            "type" => "system",
            "data" => { "content" => "You cannot send a friend request to #{target.capitalize} because he blocked you." }
          }.to_json)
        else
          req = { "from" => @username }
          ChatStore.mutex.synchronize do
            if ChatStore.clients.key?(target) && !ChatStore.clients[target].empty?
              ChatStore.clients[target].each { |socket| socket.send({ "type" => "friend_request", "data" => req }.to_json) }
            end
          end
        end

      when "friend_response"
        target = data["to"].to_s.downcase
        response = { "from" => @username, "accepted" => data["accepted"] }
        if data["accepted"]
          ChatStore.add_friend(@username, target)
        else
          ChatStore.remove_friend(@username, target)
        end
        ChatStore.mutex.synchronize do
          if ChatStore.clients.key?(target) && !ChatStore.clients[target].empty?
            ChatStore.clients[target].each do |socket|
              socket.send({ "type" => "friend_response", "data" => response }.to_json)
            end
          end
        end          

      when "remove_friend"
        target = data["to"].to_s.downcase
        removal = { "from" => @username }
        # Rimuovi la relazione di amicizia lato server
        ChatStore.remove_friend(@username, target)
        ChatStore.mutex.synchronize do
          if ChatStore.clients.key?(target) && !ChatStore.clients[target].empty?
            ChatStore.clients[target].each { |socket| socket.send({ "type" => "friend_removed", "data" => removal }.to_json) }
          end
        end
        sock.send({ "type" => "friend_removed", "data" => { "from" => target } }.to_json)          

      when "private_chat_started"
        target = data["to"].to_s.downcase
        chat_data = { "from" => @username }
        ChatStore.mutex.synchronize do
          if ChatStore.clients.key?(target) && !ChatStore.clients[target].empty?
            ChatStore.clients[target].each { |socket| socket.send({ "type" => "private_chat_started", "data" => chat_data }.to_json) }
          end
        end

      when "block_user"
        target = data["to"].to_s.downcase
        # Rimuovi la relazione di amicizia se esiste
        ChatStore.remove_friend(@username, target)
        ChatStore.block_user(@username, target)
        message = {
          "date"    => Time.now.iso8601,
          "from"    => "system",
          "to"      => target,
          "content" => "You have been blocked by #{@username.capitalize}."
        }
        if ChatStore.clients.key?(target) && !ChatStore.clients[target].empty?
          ChatStore.clients[target].each { |socket| socket.send({ "type" => "system", "data" => message }.to_json) }
        else
          ChatStore.add_offline_message(target, { type: "system", data: message })
        end          

      when "unblock_user"
        target = data["to"].to_s.downcase
        ChatStore.unblock_user(@username, target)

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
