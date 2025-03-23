# main.rb

# require 'timeout'
require 'json'
require 'digest'

# load ((File.file? '/var/common/Ports.rb') ? '/var/common/Ports.rb' : '../common_tools/tools/Ports.rb')

# load ((File.file? '/var/common/RequestUnpacker.rb') ? '/var/common/RequestUnpacker.rb' : '../common_tools/tools/RequestUnpacker.rb')

# load ((File.file? '/var/common/BetterPG.rb') ? '/var/common/BetterPG.rb' : '../common_tools/tools/BetterPG.rb')

Dir['/var/common/*.rb'].each { |file| require file }

require_relative 'GuestsList'

DEFAULT_ERROR_RES = { 'status' => 'user_manager: failed', 'success' => 'false' }
DEFAULT_SUCCESS_RES = { 'status' => 'success', 'success' => 'true' }
DEFAULT_MISSING_PARAM = { 'status' => 'user_manager: missing mandatory data', 'success' => 'false' }

$stdout.sync = true
SERVICE_NAME = 'user_manager'
PORT = PortFinder::FindPort.new(SERVICE_NAME).getPort

LOGIN = BetterPG::SimplePG.new 'users',
                               ['id INT', 'display_name TEXT', 'realname TEXT', 'email TEXT', 'image TEXT', 'bio TEXT',
                                'created NUMERIC', 'num_friends NUMERIC', 'friends_list TEXT[]', 'level FLOAT', 'token TEXT']


GUEST = GuestsList.new
# REQUIRED_FOR_ADDUSER = %w[email display_name realname bio image]


def add_user(_client, obj = nil)
  puts 'add_user called' if DEBUG_MODE

  data = obj # ['data']

  return GUEST.add_guest data['username'] if obj['login_as_guest']   # create user as guest

  return DEFAULT_MISSING_PARAM.clone if data['realname'].nil?

  if (LOGIN.select ['realname'], [data['realname']])[0]
    puts "user already present (#{data['realname']})"
    return { 'status' => 'user_manager: user with same login_name already in database', 'success' => 'false' }
  end

  begin
    max = (LOGIN.exec 'SELECT MAX(id) FROM users')[0]
  rescue StandardError
    max = { 'max' => 0 }
  end

  fields = LOGIN.getColumns
  values = {}

  fields.each do |f|
    values[f] = data[f] if data[f]
  end
  values['id'] = max['max'].to_i
  values['token'] = Digest::SHA256.hexdigest values['realname']
  puts "inserting new user: #{values}"
  LOGIN.addValues values.values, values.keys
  puts "Success! User token: #{values['token']}"
  {'status' => 'success', 'success' => 'true', 'token' => values['token']}
end

def login_user(client, obj)
  puts "login_user called"
  data = obj['data']

  return GUEST.add_guest data['username'] if obj['login_as_guest'] == 'true'   # create a guest

  if obj['token'].to_s == token
    if usr = (LOGIN.select ['token'], [data['token']])[0]
      return usr.merge({'status' => 'success', 'success' => 'true'})
    end
    return GUEST.login_with_token(token)
  end

  r = nil
  if (usr = LOGIN.select ['realname'], [data['realname']])[0]
    LOGIN.valueManipulation 'realname', data['realname']
    return usr.merge({'status' => 'success', 'success' => 'true'})
  end rescue r
  return {'status' => 'user_manager: bad request', 'success' => 'false'} unless r.nil?
  return add_user(client, obj) if obj['do_create']
  
  {'status' => 'user_manager: user not found', 'success' => 'false'}
end

def logout_user(client, obj)
  return GUEST.del_guest obj['username'] if obj['username']
  return DEFAULT_MISSING_PARAM.clone unless obj['realname']

  LOGIN.valueManipulation 'realname', obj['realname']
end

def get_user(_client, obj = nil)
  puts 'get_user called' if DEBUG_MODE
  res = DEFAULT_ERROR_RES.clone
  
  return res unless obj

  lst = []
  lst_guest = []
  res['status'] = 'invalid request'
  params = obj['params']
  params = [params] if params.class.to_s == 'Hash'
  if params.nil? || params == [{}]
    puts 'Returning whole database'
    users = LOGIN.select
    # puts "####", users
    res = DEFAULT_SUCCESS_RES.clone
    res['user'] = users
    res['guest'] = GUEST.get_all_guests
    res['status'] = 'no users found' if users.empty? && res['guest'].empty?
    return res
  end
  if params.class.to_s == 'Array'
    puts 'looking for users with ' + params.to_s if DEBUG_MODE
    params.each do |p|
      cols = []
      keys = []
      p.reject{ |key, _val| key == 'username' || key == 'logged_in' }.each do |key, val|
        return DEFAULT_ERROR_RES.clone if key.nil? || key.empty?

        cols.append key.to_s
        keys.append val.to_s
      end
      if p['username'] && p['type'].to_s != 'login'
        t = GUEST.get_guests(p['username'], (p['logged_in'].to_s == 'true' ? true : false))
        lst_guest += t if t
      end
      if !cols.empty?
        users = LOGIN.select cols, keys
      lst = lst + users
      end
    end
    res = DEFAULT_SUCCESS_RES.clone
    res['status'] = 'no users found' if lst.empty? && lst_guest.empty?
    res['user'] = lst
    res['guest'] = lst_guest

    # In case no filter is given returns whole databases
  end
  res
end

def update_user(_client, obj = nil)
  puts 'update_user called' if DEBUG_MODE

  r = nil
  res = DEFAULT_ERROR_RES.clone
  return res if !obj || !(params = obj['new_params']) || !(lname = obj['display_name'])
  return { 'status' => 'user_manager: Invalid login name change request', 'success' => 'false' } if params.include? 'display_name'

  # (LOGIN.select ["display_name"], [lname])[0] rescue r
  usr = begin
    (LOGIN.select ['display_name'], [lname])[0]
  rescue StandardError
    r
  end
  return { 'status' => 'user_manager: display_name not found', 'success' => 'false' } if r || usr.nil?

  cols = []
  keys = []
  params.each do |key, val|
    cols.append key.to_s
    keys.append val.to_s
  end

  LOGIN.update cols, keys, "display_name = '" + lname + "'"
  DEFAULT_SUCCESS_RES.clone
end

def drop_users(_client, _obj = nil)
  does = 'yesiam' # obj['reallysure']
  if does.to_s == 'yesiam'
    LOGIN.dropTable
    _client.puts DEFAULT_SUCCESS_RES.to_json
    _client.close
    exit
  end
  DEFAULT_ERROR_RES.clone
end

def user_manager(client, _server)
  res = DEFAULT_ERROR_RES.clone
  t = select [client], [], [], 20 # waits for client, a few seconds
  return if t.nil? || t[0].empty? || client.closed?

  msg = client.read_nonblock Ports::MAX_MSG_LEN
  bobj = JSON.parse(msg)
  # client.puts "HTTP/1.1 200 OK\r\n\r\n" if bobj['header'] # parsed an http request
  begin
    res = case bobj['method'].to_s
    when 'add_user'
      add_user client, bobj
    when 'get_user'
      get_user client, bobj
    when 'update_user'
      update_user client, bobj
    when 'drop_users'
      drop_users client, bobj
    when 'drop_guests'
      exit
    when 'login_user'
      login_user client, bobj
    when 'logout_user'
      logout_user client, bobj
    else
      {'status' => 'user_manager: unknown method: ' + bobj['method'].to_s, 'success' => 'false'}
    end
  rescue => r
    return {'status' => "user_manager: error: #{r.to_s}", 'success' => 'false'}.to_json
  end

  client.puts res.to_json
end

puts 'user_manager active at port ' + PORT.to_s + "\n"
(SimpleServer::SimplerTCP.new PORT, :user_manager).start_loop