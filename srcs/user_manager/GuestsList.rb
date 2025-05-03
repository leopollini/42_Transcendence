

MAX_GUEST_COUNT = 10

require 'dotenv'
require 'colorize'

Dotenv.load

class GuestsList
  
  def initialize()
    @guests = Array.new(MAX_GUEST_COUNT + 1)
    @index = Hash.new
    @counter_index = 0
  end

  def add_guest(data)
    username = data['username']
    return DEFAULT_MISSING_PARAM.clone unless username.is_a?(String)
    return { 'status' => 'username already in use', 'success' => 'false' } if @index.key?(username)
  
    i = @counter_index
    @counter_index = (@counter_index + 1) % MAX_GUEST_COUNT
  
    @index.delete(@guests[i]['username']) if @guests[i]
    
    @guests[i] = {
      'username' => username,
      'created' => Time.now.to_i,
      'deleted' => -1,
      'bio' => data['bio'].to_s,
      'image' => data['image'].to_s,
      'token' => data['token'],
      'is_playing' => false
    }
    
    @index[username] = i

  # TOKEN MANAGEMENT
    {
      'service' => 'user_manager',
      'status' => 'success',
      'success' => 'true',
      'username' => username,
      'token' => data['token']
    }
  end

  def del_guest(username)
    index = @index[username]
    return { 'status' => 'user not found', 'success' => 'false' } if index.nil?
  
    @guests[index] = nil
    @index.delete(username)
  
    {
      'status' => 'success',
      'success' => 'true'
    }
  end
  
  def get_all_guests()
    t = @guests.clone    #watch out! Could be deleting original object
    t[1..].each do |g|
      if g.nil?
        t.delete g 
      else
        g.slice!(g.keys - ['token'])
      end
    end
    t.values
  end

  def get_by_name(name)
    @guests[@index[name].to_i]
  end
  
  def update_guest(username, new_data)
    index = @index[username]
    return { 'status' => "user #{username} not found", 'success' => 'false' } if index.nil?
  
    guest = @guests[index]
    return { 'status' => "cannot change this info", 'success' => 'false' } if new_data['username'] || new_data['created'] || new_data['deleted']
    return { 'status' => 'changing invalid info', 'success' => 'false' } unless (new_data.keys - ['bio', 'image']).empty?
  
    guest['bio'] = new_data['bio'] if new_data['bio']
    guest['image'] = new_data['image'] if new_data['image']
    { 'status' => 'success', 'success' => 'true' }
  end

  def get_token_name(token)
    unless @guests.empty?
      return {'statuts' => 'bad token', 'success' => 'false'} if token.nil?
      @guests[1..].each do |entry|
        next if entry.nil?
        if entry['token'].to_s.strip == token.to_s.strip
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


  def del_guest_by_token(token)
    unless @guests.empty?
      @guests[1..].each_with_index do |entry, index|
        next if entry.nil?
        if entry['token'].to_s.strip == token.to_s.strip
          @guests.delete_at(index + 1)
          @index.delete token
          return {'service' => 'user_manager', 'status' => "guest deleted succesfully", 'success' => 'true'}
        end
      end
      return {'service' => 'user_manager', 'status' => " (guest) does not exist", 'success' => 'false'}
    end
  end

  def exists?(username)
    @guest[@index[username]]['deleted'] == -1 if @index[username]
  end

  def set_playing(token, value)
    guest = @guests[@tokens[token].to_s]
    return nil if guest.nil?
    guest['is_playing'] = value
  end

  def is_playing?(username)
    guest = @guests[@index[username].to_s]
    return nil if guest.nil?
    guest['is_playing'] == 'true'
  end
end