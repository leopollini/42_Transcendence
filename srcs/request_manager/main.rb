# main.rb

# require 'timeout'
require 'json'


load ((File.file? '/var/www/common/Ports.rb') ? '/var/www/common/Ports.rb' : '../common_tools/tools/Ports.rb')

load ((File.file? '/var/www/common/RequestUnpacker.rb') ? '/var/www/common/RequestUnpacker.rb' : '../common_tools/tools/RequestUnpacker.rb')


load ((File.file? '/var/www/common/BetterPG.rb') ? '/var/www/common/BetterPG.rb' : '../common_tools/tools/BetterPG.rb')


$stdout.sync = true
SERVICE_NAME = "request_manager"

ALLOW_CLIENT_COMMANDS = true

PGS = BetterPG::SimplePG.new "pages", ["uri TEXT", "content TEXT", "id INT"]
USR = BetterPG::SimplePG.new "users", ["id INT", "username TEXT", "password TEXT", "token TEXT"]

def manage_req(client, server)
	IO::select([client])
	return if client.closed?
	msg = client.read_nonblock Ports::MAX_MSG_LEN
  begin
  	bobj = JSON.parse msg
  rescue => r
    puts r
    raise r
  end


	case (bobj["method"])
  when "exec"
	  client.puts "HTTP/1.1 200 OK\r\n\r\n"
    puts USR.exec bobj["client_command"] rescue r
  when "GET"
    content = File.readlines(File.join(__dir__, '/public/', bobj['page'].to_s)).join() rescue r
    if content
	    client.puts "HTTP/1.1 200 OK\r\n\r\n"
      client.puts content
    else
	    client.puts "HTTP/1.1 404 Not Found\r\n\r\n"
    end
    puts "requested " + bobj['page']
  else
    client.puts msg
  end

end

puts "WARNING: Client commands are active and accessible by sending a \"client_command\" field (content will be space joined)"

print "lolresponse active at port ", PortFinder::FindPort.new(SERVICE_NAME).getPort, "\n"
(SimpleServer::SimplerTCP.new PortFinder::FindPort.new(SERVICE_NAME).getPort, :manage_req).start_loop

# print "lolresponse active at port ", 9001, "\n"
# (SimpleServer::SimplerTCP.new 9001, :manage_req).start_loop

