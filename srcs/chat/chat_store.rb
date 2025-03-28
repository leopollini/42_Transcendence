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
    r = nil
    if alive?
      @socket.puts msg
    else
      @unread << msg
      @unread = @unread[10..] if @unread.size > MAX_UNREAD_SIZE
    end rescue r
    this.close if r
  end

  def close
    @socket_open = false
    @socket.close unless @socket.closed?
  end

  def load_unread
    @unread.each do | msg |
      @socket.puts msg
    end
  end

  def alive?
    @socket_open
  end

  def add_friend(who)
    @friends << who
  end

  def rm_friend(who)
    @friends.delete who
  end

  def block_usr(who)
    @blocked << who
  end

  def unblock_usr(who)
    @blocked.delete who
  end
end

class ChatStore
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
      return @@clients[from].send_sys "#{to} is not a member of this general chat!" if @@clients[to].nil?
      return @@clients[from].send_sys "#{to} has blocked you: you cannot be friends!" if @@clients[to].blocked.include? from
      return @@clients[from].send_sys "You must first unblock #{to} in order to be friends!" if @@clients[from].blocked.include? from
      return @@clients[from].send_sys "You and #{to} are already #{@@clients[to].friends.size == 1 ? "best " : ""}friends!" if @@clients[to].friends.include? from

      # puts "Sending friend request to #{to} (#{@@clients[to]} : #{@@clients.keys})"

      @@clients[to].send_me({"from" => from}, 'friend_request')
      @@clients[from].send_sys "Friend request sent to #{to}"
    end
  end

  def self.friend_res(requester, accepter, accepted)
    @@mutex.synchronize do
      @@clients[accepter].send_sys("You have #{accepted ? "accepted" : "denied"} #{requester}'s friend request!")
      @@clients[requester].send_me({"accepted" => accepted, 'from' => accepter}, 'friend_response')
      if accepted
        @@clients[requester].add_friend accepter
        @@clients[accepter].add_friend requester
      end
    end
    puts "#{requester} and #{accepter} are now friends!"
  end

  def self.remove_friend(target, user)
    ChatStore.clients[target].send_me({"from" => user}, 'friend_removed')
    ChatStore.clients[user].send_me({"from" => target}, 'friend_removed')
    ChatStore.clients[user].rm_friend target
    ChatStore.clients[target].rm_friend user
  end

  def self.block(target, user)
    ChatStore.clients[user].send_sys "You have blocked #{target}"
    ChatStore.clients[target].send_sys "You have been blocked by #{user}"
    ChatStore.clients[user].block_user target

    remove_friend target, user
  end

  def self.clients
    @@clients
  end
end