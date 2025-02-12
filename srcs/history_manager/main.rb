require 'socket'
require 'timeout'

load ((File.file? '/var/common/Ports.rb') ? '/var/common/Ports.rb' : '../common_tools/tools/Ports.rb')

load ((File.file? '/var/common/RequestUnpacker.rb') ? '/var/common/RequestUnpacker.rb' : '../common_tools/tools/RequestUnpacker.rb')

load ((File.file? '/var/common/BetterPG.rb') ? '/var/common/BetterPG.rb' : '../common_tools/tools/BetterPG.rb')

$stdout.sync = true
SERVICE_NAME = "history_manager"
PORT = PortFinder::FindPort.new(SERVICE_NAME).getPort
GAMES = BetterPG::SimplePG.new "games_history", ["player1 TEXT", "player2 TEXT", "points_player1 NUMERIC", "points_player2 NUMERIC", "duration NUMERIC", "ended NUMERIC", "mode TEXT"]

def get_user_match(client, req)
  playername = req["get_user_match"]
  games = GAMES.select ["player1", "player2"], [playername.to_s, playername.to_s], [], "OR"
  client.puts games.to_json
end

def get_match_count(client, req)
  client.puts (GAMES.exec "SELECT COUNT(player1) FROM games_history")[0].to_json
end

def history_manager(client, server)
	select [client]
  return if client.closed?
	msg = client.read_nonblock Ports::MAX_MSG_LEN
  req = RequestUnpacker::Unpacker.new.unpack msg
  puts "###",req
  return get_match_count client, req if req["get_match_count"]
  return get_user_match client, req if req["get_user_match"]
  player1 = req["player1"]          # player1 login_name
  player2 = req["player2"]          # player2 login_name ('IA' if opponent was ia)
  points1 = req["points_player1"]   # total points player1
  points2 = req["points_player2"]   # total points player2
  duration = req["duration"]        # match duration
  ended = req["ended"]              # match end time
  mode = req["mode"]                # math gamemode (default, tournament, ia, powerups, ...)

  if !player1 || !player2 || !points1 || !points2 || !duration || !ended || !mode
    client.close
    raise "Missing match info" 
  end

  GAMES.addValues [player1, player2, points1, points2, duration, ended, mode], GAMES.getColumns
  client.puts "Done."
end

puts "Starting server at port " + PORT.to_s + "!"
(SimpleServer::SimplerTCP.new PORT, :history_manager).start_loop
