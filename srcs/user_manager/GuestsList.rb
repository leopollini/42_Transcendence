MAX_GUEST_COUNT = 10

class GuestsList
  def initialize()
    @guests = []
    @index = {}
    @counter = 0
  end

  def add_guest(username)
    return DEFAULT_MISSING_PARAM.clone if username.class != "".class
    return {'status' => 'username already in use', 'success' => 'false'} if @guests[@index[username].to_i]
    
    @counter = @counter % MAX_GUEST_COUNT + 1
    @index.delete @guests[@counter]['username'] if @guests[@counter]
    @index[username] = @counter
    @guests[@counter] = {'username' => username, 'created' => Time.now.to_i, 'deleted' => -1}
    puts "added #{username}!"
    {'status' => 'success', 'success' => 'true'}
  end
  def del_guest(username)
    return DEFAULT_MISSING_PARAM.clone if username.class != "".class
    return {'status' => "#{username} (guest) does not exist", 'success' => 'false'} unless @index[username]

    @guests[@index[username]]['deleted'] = Time.now.to_i
    @index.delete username
    puts "removed #{username}!"
    {'status' => 'success', 'success' => 'true'}
  end
  def get_guests(username, logged = false)
    if logged
      t = @guests[@index[username].to_i]
      return t ? [t] : nil?
    end
    @guests.count > 0 ? @guests[1..].select { |g| g['username'] == username } : []
  end
  def get_all_guests()
    @guests.count > 0 ? @guests[1..] : []
  end
  def drop_guests()
    initialize
    DEFAULT_SUCCESS_RES.clone
  end
end