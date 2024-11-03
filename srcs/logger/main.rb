require 'socket'
require 'timeout'
load '/var/www/common/Ports.rb' if File.file?("/var/www/common/Ports.rb")
load '../common_tools/tools/Ports.rb' if File.file?("../common_tools/tools/Ports.rb")

if !(File.file?("../common_tools/tools/Ports.rb") || File.file?("/var/www/common/Ports.rb"))
	puts "load file not found"
	exit -1
end

SERVICE_NAME = 'logger'

def loggering(client, server)
	# puts "log request received" if DEBUG_MODE
	loop do
  	msg = ""
		IO::select([client])
		return if client.closed?
		begin
			while (t = client.read_nonblock(Ports::MAX_MSG_LEN)).size == Ports::MAX_MSG_LEN do
				msg += t
			end
		rescue => r
			return
		end
		msg += t
    puts '<' + Time.now.strftime("%H:%M").to_s + '> ' + client.addr(true)[2] + ': ' + msg
	end
end

puts "simple logger active"
(SimpleServer::SimplerTCP.new PortFinder::FindPort.new(SERVICE_NAME).getPort, :loggering).start_loop
