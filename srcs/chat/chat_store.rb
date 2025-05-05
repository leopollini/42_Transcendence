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
    @waiting_friends = []
    @blocked = []
    @be_blocked = []
    @open_chats = []
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
      @socket.send msg
    else
      @unread << msg
      @unread = @unread[10..] if @unread.size > MAX_UNREAD_SIZE
    end rescue r
    this.close_sock if r
  end

  def close_sock
    @socket_open = false
  end

  def load_unread
    @unread.each do | msg |
      @socket.send msg
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

  def block_user(who)
    @blocked << who
  end

  def unblock_user(who)
    @blocked.delete who
  end

  def be_blocked(who)
    @be_blocked << who
  end

  def be_unblocked(who)
    @be_blocked.delete who
  end

  def get_waiting_friends
    @waiting_friends
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
    puts "broadcasting message: #{msg}"
    @@mutex.synchronize do
      @@clients.each do | usr, cli |
        cli.send_me({ 'content' => msg }, 'system') unless usr == avoid
      end
    end
  end

  def self.broadcast(content, type, avoid = "")
    puts "broadcasting message: #{content}"
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
      @@clients[from].get_waiting_friends << to
      @@clients[to].get_waiting_friends << from
      @@clients[to].send_me({"from" => from}, 'friend_request')
      @@clients[from].send_sys "Friend request sent to #{to}"
    end
  end

  def self.friend_res(requester, accepter, accepted)
    @@mutex.synchronize do
      @@clients[accepter].send_sys("You have #{accepted == 'true' ? "accepted" : "denied"} #{requester}'s friend request!")
      @@clients[requester].send_me({"accepted" => accepted, 'from' => accepter}, 'friend_response')
      @@clients[requester].get_waiting_friends.delete accepter
      @@clients[accepter].get_waiting_friends.delete requester
      puts "ACCEPTED IS #{accepted}".green.bold
      if accepted == 'true'
        @@clients[requester].add_friend accepter
        @@clients[accepter].add_friend requester
      end
    end
    puts "#{requester} and #{accepter} are now friends!"
  end

  def self.remove_friend(target, user)
    @@clients[target].send_me({"from" => user}, 'friend_removed')
    @@clients[user].send_me({"from" => target}, 'friend_removed')
    @@clients[user].rm_friend target
    @@clients[target].rm_friend user
  end

  def self.block(target, user)
    ChatStore.remove_friend(target, user)
    @@clients[user].send_sys "You have block #{target}"
    @@clients[target].send_me({ 'from' => user }, 'block_user') 
    @@clients[user].block_user target
    @@clients[target].be_blocked user

    remove_friend target, user
  end

  def self.get_client_state(user)
    client = ChatStore.clients[user]
    info = {"friends" => client.friends, "friend_requests" => client.get_waiting_friends,
            "blocked_users" => client.blocked, "pending_requests" => [], "blocked_by" => client.blocked_by}
    puts "sending state info: #{info}"
    client.send_me(info, "state")
  end

  def self.start_private_chat(target, user)
    @@clients[target].send_me({"from" => user}, 'private_chat_started')
  end

  def self.clients
    @@clients
  end

  def self.exists?(username)
    @@clients[username] && @@clients[username].alive?
  end

  def self.close_client(username)
    @@clients[username].close_sock
  end

  def self.get_online(include_guests)
    users = (@@clients.select {|u, c| c.alive?}).keys
    puts "all connected users: " + users.to_s
    # if include_guests.to_s == 'false'
    #   login_users = []
    #   (JSON.parse SimpleServer::method_req("get_user", {'avoid_guests' => 'true'}))['user'].each do |u|
    #     login_users << u['display_name']
    #   end
    #   puts "all login users: " + login_users.to_s
    #   users = users & login_users
    #   puts "connected login users: " + users.to_s
    # end
    {"status" => (users.empty? ? "no online users" : "success"), "success" => "true", "online_users" => users}
  end
end