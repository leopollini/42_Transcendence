

MAX_GUEST_COUNT = 50

require 'dotenv'
require 'colorize'

Dotenv.load

class GuestsList
  
  def initialize()
    reset
  end
  
  def reset()
    @guests = []
    @index = {}
    @counter_index = 0
  end

  def add_guest(data, logged_in)
    username = data['username']
    return DEFAULT_MISSING_PARAM.clone unless username.is_a?(String)
    return { 'status' => 'username taken', 'success' => 'false' } if @index.key?(username)
  
    i = @counter_index
    @counter_index = (@counter_index + 1) % MAX_GUEST_COUNT
  
    @index.delete(@guests[i]['username']) if @guests[i]

    
    @guests[i] = {
      'username' => username,
      'created' => Time.now.to_i,
      'deleted' => -1,
      'bio' => data['bio'].to_s,
      'image' => data['image'].to_s,
      'token' => data['token']
    }
    
    @index[username] = i
    logged_in << username

    {
      'service' => 'user_manager',
      'status' => 'success',
      'success' => 'true',
      'username' => username,
      'token' => data['token']
    }
  end
  
  def del_guest(username, logged_in)
    index = @index[username]
    return { 'status' => 'user not found', 'success' => 'false' } if index.nil?
  
    @guests[index] = nil
    @index.delete(username)
    logged_in.delete username
  
    {
      'status' => 'success',
      'success' => 'true'
    }
  end
  
  def get_all_guests()
    t = @guests.clone    #watch out! Could be deleting original object
    t.each do |g|
      if g.nil?
        t.delete g 
      else
        puts "ASLIHASDHKAJSDH SLICING!"
        g.slice!(g.keys - ['token'])
      end
    end
    t
  end

  def get_by_name(name)
    return nil if @index[name].nil?
    @guests[@index[name].to_i]
  end
  
  def update_guest(username, new_data)
    index = @index[username]
    return { 'status' => "user not found (#{username})", 'success' => 'false' } if index.nil?
  
    guest = @guests[index]
    puts "modifying #{username}'s info: #{new_data}".green
    return { 'status' => 'changing invalid info', 'success' => 'false' } unless (new_data.keys - ['bio', 'image', 'display_name']).empty?
    # return { 'status' => 'changing invalid info', 'success' => 'false' } unless (new_data.keys - ['bio', 'image']).empty?
  
    guest['bio'] = new_data['bio'] if new_data['bio']
    # guest['image'] = new_data['image'] if new_data['image']
    { 'status' => 'success', 'success' => 'true' }
  end

  def get_token_name(token)
    unless @guests.empty?
      return {'statuts' => 'bad token', 'success' => 'false'} if token.nil?
      @guests[].each do |entry|
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
      @guests[].each_with_index do |entry, index|
        next if entry.nil?
        if entry['token'].to_s.strip == token.to_s.strip
          @guests.delete_at(index + 1)
          @index.delete token
          return {'service' => 'user_manager', 'status' => "guest deleted succesfully", 'success' => 'true'}
        end
      end
      return {'service' => 'user_manager', 'status' => " guest does not exist", 'success' => 'false'}
    end
  end

  def exists?(username)
    if @index.key?(username)
      @guests[@index[username].to_i] && @guests[@index[username].to_i]['deleted'].to_i == -1
    else
      false
    end
  end

  def exists_token?(token)
    @guests.each do |g|
      return g['username'] if g && g['token'].to_s == token.to_s
    end
      nil
  end
end