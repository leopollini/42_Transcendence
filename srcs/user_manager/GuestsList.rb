

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

  def add_guest(data)
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
  def get_token_name(name)
    unless @guests.empty?
      @guests[1..].each do |entry|
        next if entry.nil?
        if entry['username'].strip == name.strip
          return {
            'status' => 'success',
            'success' => 'true',
            'username' => entry['username'],
            'bio' => entry['bio'],
            'image' => entry['image'],
            'type' => 'guest'
          }
        end
      end
      return {'status' => 'invalid token', 'success' => 'false'}
    else
      return {'status' => 'no users found', 'success' => 'false'}
    end
  end


  def del_guest(name)
    unless @guests.empty?
      @guests[1..].each_with_index do |entry, index|
        next if entry.nil?
        if entry['username'].strip == name.strip
          @guests.delete_at(index + 1)
          @index.delete name
          return {'service' => 'user_manager', 'status' => "guest deleted succesfully", 'success' => 'true'}
        end
      end
      return {'service' => 'user_manager', 'status' => " (guest) does not exist", 'success' => 'false'}
    end
  end
end