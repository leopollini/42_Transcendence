# Ports.rb

module Ports
  HASH = {
		# sample:
		#"method" => ["service_to_call", port_to_service]
		"GET" => ["request_manager", 9000],
		"HEAD" => ["localhost", 9090]
	}
	MAX_MSG_LEN = 100000
	DEBUG_MODE = true
end

module SimpleServer
	class SimplerTCP
		@@server
    @@function
    @@tokens
		def initialize(port, funct = nil)
			@@server = TCPServer.new port rescue r
			@@function = funct
		end
    def start_loop
      loop {
        Thread.start(@@server.accept) do |client|
          begin
            method(@@function).call(client, self)
          rescue => r
						puts "Catched: " + r.to_s if Ports::DEBUG_MODE
          end
          client.close if !client.closed?
          puts "Connection concluded" if Ports::DEBUG_MODE
        end
      }
		end
    def setFunction(server_side_function)
      @@function = server_side_function
    end
	end
end

def find_port(name)
  Ports::HASH.each do |key, val|
    if val[0] == name
      return val[1]
    end
  end
end
