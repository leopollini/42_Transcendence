require 'thread'
require 'set'
require 'time'

MAX_UNREAD_SIZE = 100

class Client
  attr_reader :blocked, :friends
  def initialize(username, sock)
    @username = username
    @unread = []
    @socket_open = true
    @friends = []
    @blocked = []
    @socket = sock
    send_me({"content" => "Welcome #{@username}!"}, "system")
  end

  def joined(sock)
    @socket = sock
    @socket_open = true
    send_me({"content" => "Welcome back #{@username}!"}, "system")
    load_unread
    @unread = []
  end

  def send_sys(msg)
    send_me({'content' => msg}, 'system')
  end

  # send content (Hash object)
  def send_me(content, type = 'message')
    msg = {'type' => type, 'data'=>content}.to_json
    if @socket_open == true
      @socket.puts msg
    else
      @unread << msg
      @unread = @unread[10..] if @unread.size > MAX_UNREAD_SIZE
    end
  end

  def close
    @socket_open = false
    @socket.close
  end

  def load_unread
    @unread.each do | msg |
      @socket.puts msg
    end
  end

  def alive?
    @socket_open
  end
end

class ChatStore
  attr_accessor :clietns
  # Clients hash: { "username" => Client object }
  @@clients = {}
  # Messaggi della chat generale (array, max 50 messaggi)
  @@general_messages = []
  # Lista dei blocchi: { "blocker" => Set["target1", "target2", ...] }
  
  @@mutex = Mutex.new

  def self.joined(username, sock)
  #check for bad sock please
    @@mutex.synchronize do
      return (@@clients[username] = Client.new username, sock) if @@clients[username].nil?
      @@clients[username].joined sock
    end
  end

  def self.purge
    @@mutex.synchronize do
      @clients = @clients.filter {| usr, cli | cli.alive?}
    end
  end

  def self.sys_broadcast(msg, avoid = "")
    puts "broadcasting mesage: #{msg}"
    @@mutex.synchronize do
      @@clients.each do | usr, cli |
        cli.send_me({ 'content' => msg }, 'system') unless usr == avoid
      end
    end
  end

  def self.broadcast(content, type, avoid = "")
    puts "broadcasting mesage: #{content}"
    @@mutex.synchronize do
      @@clients.each do | usr, cli |
        cli.send_me(content, type) unless usr == avoid
      end
    end
  end

  def self.friend_req(to, from)
    @@mutex.synchronize do
      return @@clients[from].send_sys "#{to} has blocked you: you cannot be friends!" if @@clients[to] and @@clients[to].include? from
      return @@clients[from].send_sys "You and #{to} are already #{@@clients[to].size == 1 ? "best " : ""}friends!" if @@clients[to] and @@clients[to].include? from

      @@clients[to].send_me({"from" => from}, 'friend_request')
      @@clients[from].send_sys "Friend request sent to #{to}"
    end
  end

  def self.friend_res(requester, accepter, accepted)
    @@mutex.synchronize do
      @@clients[accepter].send_sys("You have #{accepted ? "accepted" : "denied"} #{requester}'s friend request!")
      @@clients[requester].send_me({"accepted" => from}, 'friend_response')
    end
  end
end