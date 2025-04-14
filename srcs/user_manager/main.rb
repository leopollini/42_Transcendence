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
                               ['id INT', 'display_name TEXT', 'realname TEXT', 'email TEXT', 'image TEXT', 'bio TEXT',
                                'created NUMERIC', 'num_friends NUMERIC', 'friends_list TEXT[]', 'level FLOAT', 'token TEXT']


GUEST = GuestsList.new
# REQUIRED_FOR_ADDUSER = %w[email display_name realname bio image]

class TokenManager

  def self.save_token_login(token)
  end

  def self.read_token_login
  end

  def self.save_token_guest(token)
  end

  def self.read_token_guest
  end

  def self.delete_token
  end
end

def add_user(_client, obj = nil)
  puts 'add_user called'.green if DEBUG_MODE
  
  return DEFAULT_ERROR_RES.clone unless obj && obj.is_a?(Hash)
  
  data = obj['data']
  
  return GUEST.add_guest(data['username']) if obj['login_as_guest']
  
  return DEFAULT_MISSING_PARAM.clone if data['realname'].nil? || data['realname'].empty?
  
  existing_user = LOGIN.select(['realname'], [data['realname']]).first
  if existing_user
    puts "User already present (#{data['realname']})".yellow
    return { 'status' => 'user_manager: user with same login_name already in database', 'success' => 'false' }
  end
  
  begin
    max = LOGIN.exec('SELECT MAX(id) AS max FROM users', []).first || { 'max' => 0 }
  rescue StandardError
    max = { 'max' => 0 }
  end
  
  fields = LOGIN.getColumns
  values = {}
  
  fields.each do |f|
    values[f] = data[f].to_s.strip if data[f].is_a?(String)
  end
  
  values['id'] = max['max'].to_i + 1
  values['token'] = Digest::SHA256.hexdigest(values['realname'])
  
  LOGIN.addValues(values.values, values.keys)
  
  puts "Success! User token: #{values['token']}".green
  { 'status' => 'success', 'success' => 'true', 'token' => values['token'] }.merge data
end

def login_user(client, obj)
  puts "login_user called".green
  data = obj['data']

  if obj['login_as_guest'] == 'true' && data.has_key?('image') && data.has_key?('username')
    token = Digest::SHA256.hexdigest(SecureRandom.alphanumeric(8))
    TokenManager.save_token_guest("#{token}")
    return GUEST.add_guest(data, token)
  end

  r = nil
  if (usr = LOGIN.select ['realname'], [data['realname']])[0]
    LOGIN.valueManipulation 'realname', data['realname'], nil #COMPLETE PLEASE
    return usr[0].merge({'status' => 'success', 'success' => 'true'})
  end rescue r
  return {'status' => "user_manager: bad request #{r.to_s}", 'success' => 'false'} if r
  return add_user(client, obj) if obj['do_create']
  
  {'service' => 'user_manager', 'status' => 'user not found', 'success' => 'false'}
end


def logout_user(client, obj)
  puts 'logout_user called'.green if DEBUG_MODE
  token = TokenManager.read_token_guest
  {"status"=>"lol", "success"=>"true"}
  # status = GUEST.del_guest_by_token(token)
  # if status && status['success'] == 'true'
  #   TokenManager.delete_token
  #   return status
  # else
  #   return status
  # end
end

def get_user(_client, obj = nil)
  puts 'get_user called'.green if DEBUG_MODE
  res = DEFAULT_ERROR_RES.clone
  
  return res unless obj

  lst = []
  lst_guest = []
  res['status'] = 'invalid request'
  params = obj['params']
  params = [params] if params.class.to_s == 'Hash'
  if params.nil? || params == [{}]
    puts 'Returning whole database'.yellow
    users = LOGIN.select
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
      if p  && p['token'] == "token"
        token = TokenManager.read_token_guest
        status = GUEST.get_token_name(token)
        puts "get_user #{status}".green
        return status
      end
      if !cols.empty?
        users = LOGIN.select(cols, keys)
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
  puts 'update_user called'.green if DEBUG_MODE

  r = nil
  res = DEFAULT_ERROR_RES.clone
  puts "params: #{obj}".yellow
  return res if !obj || !(params = obj['new_params']) || !(lname = obj['display_name'])
  return { 'service' => 'user_manager', 'status' => 'Invalid login name change request', 'success' => 'false' } if params.include? 'display_name'

  usr = begin
    (LOGIN.select ['display_name'], [lname])[0]
  rescue StandardError
    r
  end
  return { 'service' => 'user_manager', 'status' => 'display_name not found', 'success' => 'false' } if r || usr.nil?

  cols = []
  keys = []
  params.each do |key, val|
    cols.append key.to_s
    keys.append val.to_s
  end

  LOGIN.update cols, keys, ['display_name = :lname'], [lname: lname]
  DEFAULT_SUCCESS_RES.clone
end

def user_manager(client, _server)
  puts "user manager called"
  res = DEFAULT_ERROR_RES.clone
  t = select [client], [], [], 20 # waits for client, a few seconds
  return if t.nil? || t[0].empty? || client.closed?
  
  msg = client.read_nonblock Ports::MAX_MSG_LEN
  bobj = JSON.parse msg
  puts "Content:".yellow, bobj
  # client.puts "HTTP/1.1 200 OK\r\n\r\n" if bobj['header'] # parsed an http request
  begin
    res = case bobj['method'].to_s
    when 'add_user'
      add_user client, bobj
    when 'get_user'
      get_user client, bobj
    when 'update_user'
      update_user client, bobj
    when 'login_user'
      login_user client, bobj
    when 'logout_user'
      logout_user client, bobj
    else
      {'service' => 'user_manager', 'status' => "unknown method: #{bobj['method'].to_s}", 'success' => 'false'}
    end
  rescue => r
    puts "Errore: #{r.message}".red
    puts "Backtrace: #{r.backtrace.join("\n")}".red
    return {'status' => "user_manager: error: #{r.to_s}", 'success' => 'false'}.to_json
  end
  puts "res = #{res}".green
  client.puts res.to_json
end

puts 'user_manager active at port ' + PORT.to_s + "\n"
(SimpleServer::SimplerTCP.new PORT, :user_manager).start_loop