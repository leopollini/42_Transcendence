# main.rb

# require 'timeout'
require 'json'
require 'thread'


load ((File.file? '/var/www/common/Ports.rb') ? '/var/www/common/Ports.rb' : '../common_tools/tools/Ports.rb')

load ((File.file? '/var/www/common/RequestUnpacker.rb') ? '/var/www/common/RequestUnpacker.rb' : '../common_tools/tools/RequestUnpacker.rb')

load ((File.file? '/var/www/common/BetterPG.rb') ? '/var/www/common/BetterPG.rb' : '../common_tools/tools/BetterPG.rb')

load 'Rooms.rb'

$stdout.sync = true
SERVICE_NAME = "game_manager"
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
		client.puts '{"Code":"username not provided","success":"false"}'
		client.close
		return
	end

	puts "player's name: " + playername
	(room, status) = ROOMS.please client, playername

	if status == Code::DUPLICATE_USERNAME
		puts "Duplicate username"
		client.puts '{"status":"duplicate_username","success":"false"}'
		client.close
		return
	end

	room.setSocket client, playername
	(s1, s2) = room.getSockets

	room.getStatus[Status::P1_STATUS] = 0 if status == Code::ENTER_AS_PLAYER1 || status == Code::NEW_ROOM_CREATED
	room.getStatus[Status::P2_STATUS] = 0 if status == Code::ENTER_AS_PLAYER2

	if !s1.nil? && !s2.nil?
		if s1.closed? || s2.closed?
			puts "something went wroing..."
			return
		end
		r = nil
		puts "Beginning match! " + room.getPlayers[0] + " vs " + room.getPlayers[1] + "!"
		s1.puts '{"opponent":"' + room.getPlayers[1] + '","status":"ready","success":"true","game_in_progress":"' + room.getStatus[Status::IN_PROGRESS].to_s + '"}'
		s2.puts '{"opponent":"' + room.getPlayers[0] + '","status":"ready","success":"true","game_in_progress":"' + room.getStatus[Status::IN_PROGRESS].to_s + '"}'	#tell player that opponent is ready
		room.getStatus[Status::IN_PROGRESS] = true if room.getStatus[Status::P1_STATUS] == 0 && room.getStatus[Status::P2_STATUS] == 0
		ROOMS.addToActive room
		loop do
			room.update
			s = IO::select([s1, s2])[0][0] rescue r
			msg = s.recv Ports::MAX_MSG_LEN rescue r
			if s == s1
				if msg.to_s == ''
					puts "Player 1 lost connection!"
					room.getStatus[Status::P1_STATUS] = 1
					break
				end
				s2.write(msg)
			else
				if msg.to_s == ''
					puts "Player 2 lost connection!"
					room.getStatus[Status::P2_STATUS] = 1
					break
				end
				s1.write(msg)
			end
		end
	end

	sleep 1 while (s2.nil? || s1.nil?) && !client.closed?	# if only the first player is in the room
	room.getStatus[Status::P1_STATUS] = 1 if client.closed?

end

print "game manager active at port ", 8998, "\n"
(SimpleServer::SimplerTCP.new 8998, :game_manager).start_loop false
