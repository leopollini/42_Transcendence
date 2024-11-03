require 'socket'
require 'timeout'
load '/var/www/common/Ports.rb' if File.file?("/var/www/common/Ports.rb")
load '../common_tools/tools/Ports.rb' if File.file?("../common_tools/tools/Ports.rb")

if !(File.file?("../common_tools/tools/Ports.rb") || File.file?("/var/www/common/Ports.rb"))
	puts "load file not found"
	exit -1
end

SERVICE_NAME = "request_manager"

def manage_req(client, server)
	client.print "HTTP/1.1 200 OK\r\n\r\nHehelolboedy\r\n"
	sleep 1
	client.close
end

puts "lolresponse active"

(SimpleServer::SimplerTCP.new PortFinder::FindPort.new(SERVICE_NAME).getPort, :manage_req).start_loop