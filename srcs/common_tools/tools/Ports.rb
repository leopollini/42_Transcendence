# Ports.rb

# creates debug module if outside container
# if File.file?("../common_tools/tools/Ports.rb")
#   module Ports
#     HASH = {
#       # sample:
#       #"method" => ["service_to_call", port_to_service]
#       "GET" => ["localhost", 9000],
#       "HEAD" => ["localhost", 9090],
#       "log" => ["localhost", 8000]
#     }
#     MAX_MSG_LEN = 100000
#   end
# else
module Ports
  HASH = {
    # sample:
    #"method" => ["service_to_call", port_to_service]
    "GET" => ["request_manager", 9000],
    "HEAD" => ["request_manager", 9090],
    "log" => ["logger", 8000]
  }
  MAX_MSG_LEN = 100000
end
# end

module FastLogger
  class LogThis
    def initialize(msg)
      socket = TCPSocket.new Ports::HASH["log"][0], Ports::HASH["log"][1]
      if !socket.closed?
        socket.print msg if msg.class.to_s == "String"
        socket.close
      end
    end
  end
end

module PortFinder
  class FindPort
    @@port = 0
    def initialize(name)
      Ports::HASH.each do |key, val|
        if val[0] == name
          @@port = val[1]
          return
        end
      end
    end
    def getPort
      return @@port
    end
  end
end

module SimpleServer
	class SimplerTCP
    include FastLogger
		@@server
    @@function
    @@tokens
		def initialize(port, funct = nil)
			@@server = TCPServer.new port
			@@function = funct
		end
    def start_loop
      loop {
        Thread.start(@@server.accept) do |client|
          begin
            method(@@function).call(client, self)
          rescue => r
						puts "Catched: " + r.to_s if DEBUG_MODE
            client.close if !client.closed?
            FastLogger::LogThis.new "Receiver catched: " + r.to_s
          end
          client.close if !client.closed?
          puts "Connection concluded" if DEBUG_MODE
        end
      }
		end
    def setFunction(server_side_function)
      @@function = server_side_function
    end
	end
end

DEBUG_MODE = true