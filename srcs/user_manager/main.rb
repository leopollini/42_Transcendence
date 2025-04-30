# main.rb

# require 'timeout'
require 'json'
require 'digest'
require 'securerandom'
require 'colorize'

# load ((File.file? '/var/common/Ports.rb') ? '/var/common/Ports.rb' : '../common_tools/tools/Ports.rb')

# load ((File.file? '/var/common/RequestUnpacker.rb') ? '/var/common/RequestUnpacker.rb' : '../common_tools/tools/RequestUnpacker.rb')

# load ((File.file? '/var/common/BetterPG.rb') ? '/var/common/BetterPG.rb' : '../common_tools/tools/BetterPG.rb')

Dir['/var/common/*.rb'].each { |file| require file }

require_relative 'GuestsList'

DEFAULT_ERROR_RES = { 'service' => 'user_manager', 'status' => 'failed', 'success' => 'false' }
DEFAULT_SUCCESS_RES = { 'status' => 'success', 'success' => 'true' }
DEFAULT_MISSING_PARAM = { 'service' => 'user_manager', 'status' => 'missing mandatory data', 'success' => 'false' }

$stdout.sync = true
SERVICE_NAME = 'user_manager'
PORT = PortFinder::FindPort.new(SERVICE_NAME).getPort

LOGIN = BetterPG::SimplePG.new 'users',
                               ['display_name TEXT', 'realname TEXT', 'email TEXT', 'image TEXT', 'bio TEXT',
                                'created NUMERIC', 'friends_list TEXT[]', 'level FLOAT', 'entered TEXT', 'token TEXT']

GUEST = GuestsList.new
MANDATORY_DATA = %w[email display_name realname bio image token]
GET_USER_SECURE_INFO = %w[display_name created image]
NON_UPDATABLE_PARAMS = %w[realname created level entered token]

# LOGGED_IN = []

def user_creat(data, token)
  puts "Cteating new user as:".green, data
  return DEFAULT_MISSING_PARAM.clone if (MANDATORY_DATA - data.keys).empty?
  LOGIN.addValues data
  return DEFAULT_SUCCESS_RES.merge({'token' => token, 'user' => (LOGIN.select_specific 'realname', data['realname'].to_s, [], false)})
end

def login_user(client, obj)
  puts "login_user called".green
  data = obj['data']
  return {"status"=> "bad request", 'success' => 'fase'} if data.nil?
  token = data['token']

  # return {'status' => 'another user with this username is already playing', 'success' => 'false'} if 
  if data['login_as_guest'].to_s == 'true'
    res = get_user(client, {"params" => {"display_name" => data['display_name']}})
    return {"status" => "username taken", "success" => "false"} if res['success'].to_s == 'true'
    return GUEST.add_guest(data)
  end
  usr = data['realname'] ? (LOGIN.select_specific 'realname', data['realname'].to_s, [], false) : nil
  puts "found: #{usr}".yellow
  if usr.nil?
    return user_creat(data, token) if obj['do_create'].to_s == 'true'
    return {'status' => 'user not found', 'success' => 'false', 'service' => 'user_manager'}
  end

  # puts "user already in database, updating with new info".yellow
  # LOGGED_IN << data['display_name']
  # (update_user(client, {"new_params" => data})).merge({'token' => token})

  
  return {'status' => 'user already online', 'success' => 'false'} if usr['token']
  
  LOGIN.updateValue('realname', usr['realname'], {'token' => data['token']})
  #SET TOKEN PLEASE
  DEFAULT_SUCCESS_RES.merge({'token' => token, 'user' => usr})
end

def update_user(client, obj = nil)
  puts 'update_user called'.green if DEBUG_MODE
  puts "Obj " + obj.to_s.gray

  if (obj && obj['new_params'])
    puts "new params = #{obj['new_params']}".yellow
    puts "avoiding by   #{NON_UPDATABLE_PARAMS}".yellow
    new_params = obj['new_params'].except NON_UPDATABLE_PARAMS
    puts "updated params = #{new_params}".yellow
  else
    return {'status' => 'missing new params', 'success' => 'false'}.clone
  end
  return {'status' => 'username taken', 'success' => 'false'} if get_user(client, {'params' => {'display_name' => new_params['display_name']}})['success'].to_s == "true"
  return DEFAULT_MISSING_PARAM.clone if new_params.empty?
  guest = GUEST.exists_token? obj['token']
  return GUEST.update_guest(guest, new_params) if guest

  LOGIN.updateValue 'token', obj['token'].to_s, new_params
  return DEFAULT_SUCCESS_RES.clone
end

def logout_user(client, obj)
  puts 'logout_user called'.green if DEBUG_MODE
  username = obj["display_name"]
  return GUEST.del_guest(username) if GUEST.exists? username
  LOGIN.updateValue 'display_name', username, {'token' => 'null'}
  # LOGGED_IN.delete username
  {"status"=>"success", "success"=>"true"}
end

# used to get ALL stored info about a 42login user
def get_user_by_token(client, obj)
  user = LOGIN.select_specific 'token', obj['token']
  return {'status' => 'invalid token', 'success' => 'false'} if user.nil?
  {'status' => 'success', 'success' => 'true', 'user' => user}
end

def get_user(_client, obj = nil)
  puts 'get_user called'.green if DEBUG_MODE
  params = obj['params']
  if params.nil? || params.empty?
    users =  (obj['avoid_logins'] == 'true' ? [] : LOGIN.select )
    users.each {| u | u = u.slice(GET_USER_SECURE_INFO) if u}
    guests = (obj['avoid_guests'] == 'true' ? [] : GUEST.get_all_guests)
    guests.each {| u | u = u.slice(GET_USER_SECURE_INFO) if u}
    return {'status' => (users.empty? && guests.empty? ? 'no user found' : 'returning whole database'), 'success' => 'true', 
              'guest' => guests, 'user' => users}
  end
  name = params['display_name']
  if name
    user = LOGIN.select(['display_name'], [name])
    if user.empty?
      guest = GUEST.get_by_name(name)
      return DEFAULT_SUCCESS_RES.merge({'guest' => guest}) if guest
      return {'status' => 'no user found', 'success' => 'false'} 
    end
    return DEFAULT_SUCCESS_RES.merge({'user' => user})
  end
  return get_user_by_token if params['token']
  DEFAULT_MISSING_PARAM.clone
end

def user_manager(client, _server)
  # puts "user manager called".yellow, "oline users: #{LOGGED_IN}"
  res = DEFAULT_ERROR_RES.clone
  t = select [client], [], [], 20 # waits for client, a few seconds
  return if t.nil? || t[0].empty? || client.closed?
  
  msg = client.read_nonblock Ports::MAX_MSG_LEN
  bobj = JSON.parse msg
  puts "Content:".yellow, bobj
  # client.puts "HTTP/1.1 200 OK\r\n\r\n" if bobj['header'] # parsed an http request
  begin
    res = case bobj['method'].to_s
    when 'get_user'
      get_user client, bobj
    when 'update_user'
      update_user client, bobj
    when 'login_user'
      login_user client, bobj
    when 'logout_user'
      logout_user client, bobj
    when 'get_user_by_token'
      get_user_by_token client, bobj
    when 'drop_users'
      LOGIN.dropTable
      GUEST.reset
    else
      {'service' => 'user_manager', 'status' => "unknown method: #{bobj['method'].to_s}", 'success' => 'false'}
    end
  rescue => r
    puts "Error: #{r.message}".red
    puts "Backtrace: #{r.backtrace.join("\n")}".red
    return {'status' => "user_manager: error: #{r.to_s}", 'success' => 'false'}.to_json
  end
  puts "res = #{res}".green
  client.puts res.to_json
end

puts 'user_manager active at port ' + PORT.to_s + "\n"
(SimpleServer::SimplerTCP.new PORT, :user_manager).start_loop