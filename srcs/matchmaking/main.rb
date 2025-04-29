# main.rb

# require 'timeout'
require 'json'
require 'digest'
require 'colorize'

# load ((File.file? '/var/common/Ports.rb') ? '/var/common/Ports.rb' : '../common_tools/tools/Ports.rb')

# load ((File.file? '/var/common/RequestUnpacker.rb') ? '/var/common/RequestUnpacker.rb' : '../common_tools/tools/RequestUnpacker.rb')

# load ((File.file? '/var/common/BetterPG.rb') ? '/var/common/BetterPG.rb' : '../common_tools/tools/BetterPG.rb')

Dir['/var/common/*.rb'].each { |file| require file }

DEFAULT_ERROR_RES = { 'service' => 'matchmaking', 'status' => 'failed', 'success' => 'false' }
DEFAULT_SUCCESS_RES = { 'status' => 'success', 'success' => 'true' }
DEFAULT_MISSING_PARAM = { 'service' => 'matchmaking', 'status' => 'missing mandatory data', 'success' => 'false' }

$stdout.sync = true
SERVICE_NAME = 'matchmaking'
PORT = PortFinder::FindPort.new(SERVICE_NAME).getPort

def make_match(players, mode)
  return DEFAULT_MISSING_PARAM.clone unless players.is_a? Array
  return {'status' => 'tournament mode not specified', 'service' => 'matchmaking', 'success' => 'false'} if mode.nil? || mode.empty?
  return {'status' => 'bad number of players', 'service' => 'matchmaking', 'success' => 'false'} if players.size != 4 && players.size != 8 && players.size != 16
  
  victories = {}
  players.each_with_index do |p, i|
    return {'status' => 'duplicate username', 'success' => 'false'} if players[(i + 1)..].include? p
    t = JSON.parse SimpleServer.method_req('get_pong_games', {'display_name' => p, 'get_rank' => 'true'})
    return DEFAULT_ERROR_RES.clone if t['success'].to_s != 'true'
    wins = t['rank']
    puts wins
    victories[wins] ||= []
    victories[wins] << p
  end
  matches = []
  victories = victories.sort.to_h

  sorted_players = []
  victories.each do |k, v|
    sorted_players.concat v
  end

  # puts "victories: ".yellow, victories.to_s
  puts "sorted players: ".yellow, sorted_players.to_s
  if mode == 'knockout'
    while sorted_players.size != 0
      match = [sorted_players[0], sorted_players[1]]
      sorted_players = sorted_players[2..]
      matches.append match
    end
  elsif mode == 'roundrobin'
    sorted_players.each_with_index do |p, i|
      for j in (i + 1)..(sorted_players.size - 1)
        matches.append [p, sorted_players[j]].shuffle
      end
    end
    matches = matches.shuffle
  end
  return {'status' => 'success', 'success' => 'true', 'matches' => matches}
end

def get_online_opponents
  online_users = JSON.parse(SimpleServer::method_req('get_online'))
  puts "online users response: #{online_users}"
  puts "online users: #{online_users} (#{online_users['success'].to_s})"
  return DEFAULT_ERROR_RES.clone if online_users['success'].to_s != 'true'
  online_users = online_users['online_users']
  return DEFAULT_ERROR_RES.clone if online_users.nil?
  rank = {}
  online_users.each do |p|
    rk = JSON.parse SimpleServer.method_req('get_pong_games', {'display_name' => p, 'get_rank' => 'true'})
    puts "Response for Rank of #{p}: #{rk}"
    return DEFAULT_ERROR_RES.clone if rk['success'].to_s != 'true'
    rank[rk['rank']] = p
  end
  puts "Rank before sorting: #{rank}".yellow
  rank.sort
  {'status' => 'success', 'success' => 'true', 'ranked players' => rank}
end

def matchmake(client, server)
  puts "matchmaking called"
  t = select [client], [], [], 20 # waits for client, a few seconds
  return if t.nil? || t[0].empty? || client.closed?
  
  msg = client.read_nonblock Ports::MAX_MSG_LEN
  bobj = JSON.parse msg
  puts "Content:".yellow, bobj
  
  res = case bobj['method']
  when 'create_tournament'
  puts "am matchmakimg lol".green
    make_match(bobj['players'], bobj['mode'])
  when 'get_online_opponents'
    get_online_opponents()
  end  
  
  
  puts res.to_json
  client.puts res.to_json
  res
  # client.puts({"status"=>"WIP", "success" => "false"}.to_json)
end

puts 'matchmaking active at port ' + PORT.to_s + "\n"
(SimpleServer::SimplerTCP.new PORT, :matchmake).start_loop