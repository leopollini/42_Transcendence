require 'socket'
require 'timeout'
require 'webrick/websocket'

require_relative 'chat_store'

Dir['/var/common/*.rb'].each { |file| require file }

LOGIN = BetterPG::SimplePG.new 'users'

$stdout.sync = true
SERVICE_NAME = 'chat'
PORT = PortFinder::FindPort.new(SERVICE_NAME).getPort

def matchmake(client,server)
  puts "matchmaker called"
  t = select [client], [], [], 20 # waits for client, a few seconds
  return if t.nil? || t[0].empty? || client.closed?

  msg = client.read_nonblock Ports::MAX_MSG_LEN
  # bobj = JSON.parse(msg)
  bobj = RequestUnpacker::Unpacker.new.unpack msg

  

end

puts 'Starting matchmaking service at port ' + PORT_1.to_s + '!'
(SimpleServer::SimplerTCP.new PORT_1, :matchmake).start_loop

