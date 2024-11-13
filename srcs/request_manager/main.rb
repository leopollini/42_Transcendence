# main.rb

require 'socket'
require 'timeout'
require 'json'

load '/var/www/common/Ports.rb' if File.file?("/var/www/common/Ports.rb")
load '../common_tools/tools/Ports.rb' if File.file?("../common_tools/tools/Ports.rb")

load '/var/www/common/BetterPG.rb' if File.file?("/var/www/common/BetterPG.rb")
load '../common_tools/tools/BetterPG.rb' if File.file?("../common_tools/tools/BetterPG.rb")

load '/var/www/common/RequestUnpacker.rb' if File.file?("/var/www/common/RequestUnpacker.rb")
load '../common_tools/tools/RequestUnpacker.rb' if File.file?("../common_tools/tools/RequestUnpacker.rb")

$stdout.sync = true

SERVICE_NAME = "request_manager"

def manage_req(client, server)
	IO::select([client])
	return if client.closed?
	msg = client.read_nonblock Ports::MAX_MSG_LEN
	bodyobj = RequestUnpacker::Unpacker.new.unpack(msg)


	client.puts "HTTP/1.1 200 OK\r\n\r\nYou ashked fors " + bodyobj["page"] + "!"
	client.puts bodyobj
end

print "lolresponse active at port ", PortFinder::FindPort.new(SERVICE_NAME).getPort, "\n"
(SimpleServer::SimplerTCP.new PortFinder::FindPort.new(SERVICE_NAME).getPort, :manage_req).start_loop
