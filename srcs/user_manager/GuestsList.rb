

MAX_GUEST_COUNT = 10

require 'dotenv'
require 'colorize'

Dotenv.load

class GuestsList
  
  def initialize()
    @guests = Array.new(MAX_GUEST_COUNT + 1)
    @index = {}
  end

  def add_guest(data)
    username = data['username']
    return DEFAULT_MISSING_PARAM.clone unless username.is_a?(String)
    return { 'status' => 'username already in use', 'success' => 'false' } if @index.key?(username)
  
    index = @guests.find_index.with_index { |g, i| i > 0 && g.nil? }
  
    if index.nil?
      oldest = @guests[1..].each_with_index.min_by { |g, i| g['created'] || Time.now.to_i }
      index = oldest ? i + 1 : 1
    end
  
    @index.delete(@guests[index]['username']) if @guests[index]
  
    @guests[index] = {
      'username' => username,
      'created' => Time.now.to_i,
      'deleted' => -1,
      'bio' => data['bio'].to_s,
      'image' => data['image'].to_s
    }
  
    @index[username] = index
  
    {
      'service' => 'user_manager',
      'status' => 'success',
      'success' => 'true',
      'username' => username
    }
  end
  
  def del_guest(username)
    index = @index[username]
    return { 'status' => 'user not found', 'success' => 'false' } unless index
  
    @guests[index] = nil
    @index.delete(username)
  
    {
      'service' => 'user_manager',
      'status' => 'guest deleted successfully',
      'success' => 'true'
    }
  end
  
  
  def get_all_guests()
    @guests[1..].compact
  end
  
  def update_guest(username, new_data)
    index = @index[username]
    return { 'status' => "user #{username} not found", 'success' => 'false' } unless index
  
    guest = @guests[index]
    return { 'status' => "cannot change this info", 'success' => 'false' } if new_data['username'] || new_data['created'] || new_data['deleted']
    return { 'status' => 'changing invalid info', 'success' => 'false' } unless (new_data.keys - ['bio', 'image']).empty?
  
    guest['bio'] = new_data['bio'] if new_data['bio']
    guest['image'] = new_data['image'] if new_data['image']
  
    { 'status' => 'success', 'success' => 'true' }
  end

end