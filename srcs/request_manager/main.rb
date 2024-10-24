require 'socket'
require 'timeout'
load '/var/www/common/Ports.rb' if File.file?("/var/www/common/Ports.rb")
load 'Ports.rb' if File.file?("Ports.rb")

SERVICE_NAME = "request_manager"

def manage_req(client, server)
	client.print "HTTP/1.1 200 OK\r\n\r\nHehelolbodey\r\n"
	sleep 1
	client.close
end

puts "request_manager now listening"

(SimpleServer::SimplerTCP.new find_port(SERVICE_NAME), :manage_req).start_loop
