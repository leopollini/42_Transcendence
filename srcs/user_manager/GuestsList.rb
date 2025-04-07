

MAX_GUEST_COUNT = 10

require 'dotenv'
require 'colorize'

Dotenv.load

class GuestsList
  
  def initialize()
    @guests = []
    @index = {}
    @counter = 0
  end

  def add_guest(data, token)
    puts "creating new guest #{data}".green
    username = data['username']
    puts "username: #{username}".yellow
    return DEFAULT_MISSING_PARAM.clone if username.class != "".class
    return {'status' => 'username already in use', 'success' => 'false'} if @guests[@index[username].to_i]

    @counter = @counter % MAX_GUEST_COUNT + 1
    @index.delete @guests[@counter]['username'] if @guests[@counter]
    @index[username] = @counter
    @guests[@counter] = {
      'username' => username,
      'created' => Time.now.to_i,
      'deleted' => -1,
      'bio' => "",
      'image' => data['image'].to_s,
      'token' => token
    }
    @guests[@counter]['bio'] = data['bio'].to_s
    @guests[@counter]['image'] = data['image'].to_s
    puts "added #{username}!".green
    return {
      'service' => 'user_manager',
      'status' => 'success',
      'success' => 'true',
      'username' => username
    }
  end
  def del_guest(username)
    return DEFAULT_MISSING_PARAM.clone if username.class != "".class
    return {'status' => "#{username} (guest) does not exist", 'success' => 'false'} unless @index[username]

    @guests[@index[username]]['deleted'] = Time.now.to_i
    @index.delete username
    puts "removed #{username}!".red
    {'status' => 'success', 'success' => 'true'}
  end
  def get_all_guests()
    @guests.count > 0 ? @guests[1..] : []
  end
  def update_guest(username, new_data)
    guest = (get_guests username, true)[0]
    return {'status' => "user #{username} not found", 'success' => 'false'} if guest.nil?
    return {'status' => "cannot change this info", 'success' => 'false'} if new_data['username'] || new_data['created'] || new_data['deleted']
    return {'status' => 'changing invalid info', 'success' => 'false'} unless (new_data - ['bio', 'image']).empty?

    guest['bio'] = new_data['bio'] if new_data['bio']
    guest['image'] = new_data['image'] if new_data['image']
  end
  def login_with_token(token)
    @guests.each do |entry|
      return @guest.to_json.merge({'status' => 'success', 'success' => 'true'}) if entry['token'].to_s == token
    end
    return {'status' => 'invalid token', 'success' => 'false'}
  end
end