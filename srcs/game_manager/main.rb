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


# params MUST include (json parsed):
#  "username": player username
# params SHOULD include (json parsed):
#  "reconnecting": true if reconnecting
#  "force_create": true to force room creation. Ignored if reconnecting. (Used for tournaments ONLY)
#  "tournament": true if player is looking for tournament room
#  "local_game": true if match is played on local (data transmission necessary for remote spectators)

def errs_check(status, client)
	if status == Code::DUPLICATE_USERNAME
		puts "Duplicate username"
		client.puts '{"status":"duplicate_username","success":"false","explain":"player with same username already in this room"}'
		client.close
		return true
	end
	if status == Code::RECONNECTION_FAILED
		puts "Reconnection failed"
		client.puts '{"status":"room_not_found","success":"false","explain":"there is no game in progress waiting for you"}'
		client.close
		return true
	end
	if status == Code::TOURNAMENT_ROOM_NOT_CREATED
		puts "Tournament room not found"
		client.puts '{"status":"room_not_found","success":"false","explain":"your tournament room has yet to be created"}'
		client.close
		return true
	end
end


def game_manager(client, server)
	IO::select([client])
	return if client.closed?
  r = nil
	msg = client.read_nonblock Ports::MAX_MSG_LEN rescue r
  return if r

	# client.print "HTTP/1.1 200 OK\r\n\r\n"
	# print "HTTP/1.1 200 OK\r\n\r\n"

	begin
		info = RequestUnpacker::Unpacker.new.unpack msg
	rescue => r
		client.puts '{"status":"bad_parsing","success":"false","explain":"' + r.to_s + ' (' + r.class.to_s + ')"}'
		client.close
		return nil
	end

	# check if user is in database (and has valid token) please

	playername = info["u"].to_s
	opponent = info["o"].to_s
	if playername == ""
		puts "Username not provided"
		client.puts '{"status":"bad_input","success":"false","explain":"username not provided"}'
		client.close
		return nil
	end

	puts "player's name: " + playername
	(room, status) = ROOMS.please info, client, playername

	return room if errs_check status, client

	(s1, s2) = room.setSocket client, playername
  other = room.getOpponentSocket client

	room.getStatus[Status::P1_STATUS] = 0 if status == Code::SUCCESS || status == Code::NEW_ROOM_CREATED

  t = ""

  if status == Code::RECONNECTED
  puts "succesfully reconnected"
    other.puts '{"opponent":"' + playername + '","status":"has_reconnected","success":"true"}' if !other.closed?
  else
    loop do
    puts "#in loop 1"
      if !other || other.closed?
        IO::select([client],[],[],5)[0]          # waits to receive message from CLIENT
        t = client.recv Ports::MAX_MSG_LEN
        if t.empty?
          client.close
          room.disconnected playername
        puts "Player " + ((room.amIP1 playername) ? "1" : "2") + " disconnected for connection timeout"
          return room
        end
        (s1, s2) = room.getSockets
        other = (s1 == client ? s2 : s1)
        # other.puts '{"opponent":"' + playername + '","status":"ready","success":"true"}'
      end
      other.puts '{"opponent":"' + playername + '","status":"ready","success":"true"}' if room.getStatus[Status::IN_PROGRESS] != 0
      break
    rescue => r
      puts r.class
      other = room.getOpponentSocket client
      client.puts '{"status":"waiting_for_opponent","success":"false"}' if !other || other.closed?
    end
  end

  
  other.puts t if !t.empty?

  ROOMS.activateRoom room

  loop do
  puts "#in loop 2"
    s = IO::select([client],[],[],10)
    if !s
      client.close
      room.disconnected playername, other
    puts "Player " + ((room.amIP1 playername) ? "1" : "2") + " disconnected for connection timeout"
      return room
    end
    m = client.recv Ports::MAX_MSG_LEN
    if m.empty?
      client.close
      room.disconnected playername, other
    puts "Player " + ((room.amIP1 playername) ? "1" : "2") + " disconnected (socket closed)"
      return room
    end
    
    if other.closed?
      other = room.getOpponentSocket client
    else
      other.puts m 
    end
  end

		# 	s1.puts '{"opponent":"' + room.getPlayers[1] + '","status":"ready","success":"true","game_in_progress":"' + room.getStatus[Status::IN_PROGRESS].to_s + '"}'
		# 	s2.puts '{"opponent":"' + room.getPlayers[0] + '","status":"ready","success":"true","game_in_progress":"' + room.getStatus[Status::IN_PROGRESS].to_s + '"}'	#tell player that opponent is ready
		# room.getStatus[Status::IN_PROGRESS] = true if room.getStatus[Status::P1_STATUS] == 0 && room.getStatus[Status::P2_STATUS] == 0
		# ROOMS.activateRoom room

  #   s = IO::select([s1, s2])[0][0] rescue r
  #   msg = s.recv Ports::MAX_MSG_LEN rescue r
	# room.getStatus[Status::P1_STATUS] = 1 if client.closed?
  return room
end

def game_manager_1(client, server)
  r = game_manager client, server

  puts "Rooms count: " + ROOMS.getRoomsCount.to_s
  ROOMS.purge r
end

print "game manager active at port ", 8998, "\n"
(SimpleServer::SimplerTCP.new 8998, :game_manager_1).start_loop false
