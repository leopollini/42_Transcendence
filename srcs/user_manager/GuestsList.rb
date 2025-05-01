

MAX_GUEST_COUNT = 50

require 'dotenv'
require 'colorize'

Dotenv.load

class GuestsList
  
  def initialize()
    reset
  end
  
  def reset()
    @guests = {}          # map of guest_di => user
    @index = {}           # map of username => index of user
    @tokens = {}          # map of token => index of user
    @counter_index = 0
  end

  def add_guest(data)
    username = data['username']
    return DEFAULT_MISSING_PARAM.clone unless username.is_a?(String)
    return { 'status' => 'username taken', 'success' => 'false' } if @index.key?(username)
  
    i = @counter_index
    @counter_index = (@counter_index + 1) % MAX_GUEST_COUNT
  
    @index.delete(@guests[i]['username']) if @guests[i]
    @tokens.delete(@guests[i]['username']) if @guests[i]

    
    @guests[i] = {
      'username' => username,
      'created' => Time.now.to_i,
      'deleted' => -1,
      'bio' => data['bio'].to_s,
      'image' => data['image'].to_s,
      'token' => data['token']
    }
    
    @index[username] = i
    @tokens[data['token']] = i

    {
      'service' => 'user_manager',
      'status' => 'success',
      'success' => 'true',
      'username' => username,
      'token' => data['token']
    }
  end

  def del_by_index(index)
    return { 'status' => 'user not found', 'success' => 'false' } if index.nil?
    return { 'status' => 'database empty', 'success' => 'false' } if @guests.empty?
  
    @guests[index] = nil
  
    {
      'status' => 'success',
      'success' => 'true'
    }
  end
  
  def del_guest(username)
    index = @index[username]
    @index[username] = nil if index
    del_by_index index
  end

  def del_by_token(token)
    index = @tokens[token]
    @tokens[token] = nil if index
    del_by_index index
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
  
  def update_guest(token, new_data)
    index = @tokens[token]
    return { 'status' => "user not found", 'success' => 'false' } if index.nil?
    return { 'status' => 'database empty', 'success' => 'false' } if @guests.empty?
  
    guest = @guests[index]
    puts "modifying #{guest['username']}'s info: #{new_data}".green
    return { 'status' => 'changing invalid info', 'success' => 'false' } unless (new_data.keys - ['bio', 'image']).empty?
  
    guest['bio'] = new_data['bio'] if new_data['bio']
    guest['image'] = new_data['image'] if new_data['image']
    { 'status' => 'success', 'success' => 'true' }
  end

  def get_token_name(token)
    unless @guests.empty?
      return {'statuts' => 'bad token', 'success' => 'false'} if token.nil?
      guest = @guests[@tokens[token]]
      if guest
        return {
          'status' => 'success',
          'success' => 'true',
          'username' => guest['username'],
          'bio' => guest['bio'],
          'image' => guest['image'],
          'type' => 'guest'
        }
      end
      return {'status' => 'invalid token', 'success' => 'false'}
    else
      return {'status' => 'database empty', 'success' => 'false'}
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
    if @tokens.key?(token)
      @guests[@tokens[tokenn].to_i] && @guests[@tokens[token].to_i]['deleted'].to_i == -1
    else
      false
    end
  end
end