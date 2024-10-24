require 'socket'
require 'timeout'

load '/var/www/common/Ports.rb' if File.file?("/var/www/common/Ports.rb")
load 'Ports.rb' if File.file?("Ports.rb")

class SimpleGateway
	@@client
	@@socket
	def initialize(sockname, client, msg)
		@@client = client
		begin
			puts "looking for method " + sockname + " at " + Ports::HASH[sockname][0] if Ports::DEBUG_MODE
			puts "at port " + Ports::HASH[sockname][1].to_s if Ports::DEBUG_MODE
			@@socket = TCPSocket.new Ports::HASH[sockname][0], Ports::HASH[sockname][1]
			@@socket.write(msg)
			self.loops
		rescue => r
      client.print "HTTP/1.1 500 Internal Server Error\r\n\r\nError: internal server error: " + r.to_s if (!client.closed? && (!defined?(@@socket) || socket.closed)) rescue r
			@@socket.close if defined?(@@socket) && !@@socket.closed?
			client.close if client.closed?
			raise r
		end
		puts "gateway closed" if Ports::DEBUG_MODE
	end
	def loops
		puts "starting gateway" if Ports::DEBUG_MODE
		loop do
			s = IO::select([@@client, @@socket])[0][0]
			break if @@socket.nil? || @@socket.closed?
			break if @@client.nil? || @@client.closed?
			msg = s.read_nonblock(Ports::MAX_MSG_LEN)
			break if msg == ''
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

def sorter(client, server)
  sleep(0.1)
  msg = ""
	loop do
		IO::select([client])
		return if client.closed?
		while (t = client.read_nonblock(Ports::MAX_MSG_LEN)).size == Ports::MAX_MSG_LEN do
			msg += t
		end
		msg += t
		method = msg[0, msg.index(' ')]
		SimpleGateway.new method, client, msg
	end
end

puts "Server started"
s = SimpleServer::SimplerTCP.new 8080, :sorter
s.start_loop

