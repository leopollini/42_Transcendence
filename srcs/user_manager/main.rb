# main.rb

# require 'timeout'
require 'json'

load ((File.file? '/var/common/Ports.rb') ? '/var/common/Ports.rb' : '../common_tools/tools/Ports.rb')

load ((File.file? '/var/common/RequestUnpacker.rb') ? '/var/common/RequestUnpacker.rb' : '../common_tools/tools/RequestUnpacker.rb')


load ((File.file? '/var/common/BetterPG.rb') ? '/var/common/BetterPG.rb' : '../common_tools/tools/BetterPG.rb')

DEFAULT_ERROR_RES = {"status"=>"failed", "success"=>"false"}
DEFAULT_SUCCESS_RES = {"status"=>"success", "success"=>"true"}

$stdout.sync = true
SERVICE_NAME = "user_manager"
PORT = PortFinder::FindPort.new(SERVICE_NAME).getPort

LOGIN = BetterPG::SimplePG.new "users", ["id INT", "login_name TEXT", "name TEXT", "email TEXT", "image TEXT", "bio TEXT"]

def add_user(client, obj = nil)
  res = {}

  return res
end
def get_user(client, obj = nil)
  return DEFAULT_ERROR_RES if !obj
  res = DEFAULT_ERROR_RES
  res["status"] = "invalid_request"
  puts obj
  if obj["list_users"] == "true"
    puts "listing user(s)" if DEBUG_MODE
    users = LOGIN.select
    lst = []
    users.each do | usr |
      lst.append usr
    end
    puts lst.to_s
    res = DEFAULT_SUCCESS_RES
    res["users"] = lst.to_s
  end
  if name = obj["name"]
    puts "getting user " + name if DEBUG_MODE
    o = LOGIN.select [], ["", "", '"' + name.to_s + '"']
    user = o[0]
    puts user.to_s
    client.puts user.to_s
    res = DEFAULT_SUCCESS_RES
    res["user"] = lst.to_s
  end
  return res
end
def set_user(client, obj = nil)
  
end

def user_manager(client, server)
  client.puts "HTTP/1.1 200 OK\r\n\r\n"
  select [client], [], [], 200 # waits for client, a few seconds
  msg = client.read_nonblock 10000
  bobj = RequestUnpacker::Unpacker.new.unpack msg
  case bobj["method"].to_s
  when "add_user"
    res = add_user client, bobj
  when "get_user"
    res = get_user client, bobj
  when "set_user"
    res = set_user client, bobj
  else
    client.puts (DEFAULT_ERROR_RES.to_s)
    raise "What the hell"
  end
  client.puts res.to_s
end

puts "user_manager active at port " + PORT.to_s + "\n"
(SimpleServer::SimplerTCP.new PORT, :user_manager).start_loop