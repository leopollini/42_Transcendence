require 'socket'
require 'timeout'
load '/var/www/common/Ports.rb'
# load 'Ports.rb'

module TCPIOUtils
	class SimpleGateway
		@@client
		@@socket
		def initialize(sockname, client, msg)
			@@client = client
			# check if port is available
			begin
				@@socket = TCPSocket.new sockname, Ports::hash[sockname]
				@@socket.write(msg)
				self.loops
			rescue => r
				@@client.print "HTTP/1.1 500 Internal Server Error\r\n\r\nError: internal server error: " + r.to_s
			end
			puts "loop endend"
			@@socket.close
			@@client.close
		end
		def loops
			puts "starting gateway"
			loop do
				s = IO::select([@@client, @@socket])[0][0]
				break if @@socket.nil? || @@socket.closed?
				break if @@client.nil? || @@client.closed?
				msg = s.read_nonblock(10000)
				break if msg == ''
				puts "sendick back '" + msg.to_s + "'"
				if s == @@socket
					@@client.write(msg)
				else
					@@socket.write(msg)
				end
			end
		end
		def finalize
			@@socket.close
		end
	end

	class SimplerTCP
		@@server
		def initialize(port)
			@@server = TCPServer.new port
		end
		
		def newConnection(server_side_function)
			Thread.start(@@server.accept) do |client|
				begin
					method(server_side_function).call(client, self)
				rescue => r
					@@client.print "HTTP/1.1 500 Internal Server Error\r\n\r\nError: internal server error: " + r.to_s
				end
				client.close
			end
		end
	end
end


def sorter(client, server)
  sleep(0.1)
  msg = ""
  while (t = client.read_nonblock(10000)).size == 10000 do
    msg += t
  end
  msg += t
  method = msg[0, msg.index(' ')]
  # TCPIOUtils::SimpleGateway.new method, client, msg
  TCPIOUtils::SimpleGateway.new "lolservice1", client, msg
end

puts "Server started"
s = TCPIOUtils::SimplerTCP.new 8080
loop {s.newConnection(:sorter)}

