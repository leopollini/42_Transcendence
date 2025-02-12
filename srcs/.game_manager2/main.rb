# main.rb

# require 'timeout'
require 'json'
require 'thread'



load ((File.file? '/var/common/Ports.rb') ? '/var/common/Ports.rb' : '../common_tools/tools/Ports.rb')

load ((File.file? '/var/common/RequestUnpacker.rb') ? '/var/common/RequestUnpacker.rb' : '../common_tools/tools/RequestUnpacker.rb')

load ((File.file? '/var/common/BetterPG.rb') ? '/var/common/BetterPG.rb' : '../common_tools/tools/BetterPG.rb')

load 'Rooms.rb'

$stdout.sync = true
SERVICE_NAME = "game_manager"
PORT = PortFinder::FindPort.new(SERVICE_NAME).getPort
ROOM_LIFETIME = 100

# USR = BetterPG::SimplePG.new "users"
# GAMES = BetterPG::SimplePG.new "games_history", ["player1 TEXT", "player2 TEXT", "points_player1 SHORTINT", "points_player2 SHORTINT", "date INT"]

ROOMS = Rooms_lst.new

def game_manager(client, server)
	IO::select([client])
	return if client.closed?
	msg = client.read_nonblock Ports::MAX_MSG_LEN

	# client.print "HTTP/1.1 200 OK\r\n\r\n"
	# print "HTTP/1.1 200 OK\r\n\r\n"

	begin
		info = RequestUnpacker::Unpacker.new.unpack msg
	rescue => r
		client.puts '{"status":"bad_parsing","success":"false","explain":"' + r.to_s + ' (' + r.class.to_s + ')"}'
		client.close
		return
	end

	# check if user is in database (and has valid token) please

	playername = info["u"].to_s
	opponent = info["o"].to_s
	if playername == ""
		puts "Username not provided"
		client.puts '{"status":"username not provided","success":"false"}'
		client.close
		return
	end

	puts "player's name: " + playername

end

print "game manager active at port ", PORT, "\n"
(SimpleServer::SimplerTCP.new PORT, :game_manager).start_loop
