MAX_GUEST_COUNT = 10

class GuestsList
  def set_zero()
    @guests = []
    @index = {}
    @counter = 0
  end

  def initialize()
    set_zero
  end

  def add_guest(username)
    puts "creating new guest #{username}"
    return DEFAULT_MISSING_PARAM.clone if username.class != "".class
    return {'status' => 'username already in use', 'success' => 'false'} if @guests[@index[username].to_i]

    @counter = @counter % MAX_GUEST_COUNT + 1
    @index.delete @guests[@counter]['username'] if @guests[@counter]
    @index[username] = @counter
    @guests[@counter] = {'username' => username, 'created' => Time.now.to_i, 'deleted' => -1, 'token' => Digest::SHA256.hexdigest username}
    puts "added #{username}!"
    {'status' => 'success', 'success' => 'true', 'token' => @guests[@counter]['token']}
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
    set_zero
    DEFAULT_SUCCESS_RES.clone
  end
  def update_guest(username, new_data)
    guest = (get_guests username, true)[0]
    return {'status' => "user #{username} not found", 'success' => 'false'} if guest.nil?
    return {'status' => "cannot change this info", 'success' => 'false'} if new_data['username'] || new_data['created'] || new_data['deleted']
    return {'status' => 'changing invalid info', 'success' => 'false'} unless (new_data - ['bio', 'image']).empty?

    guest['bio'] = new_data['bio'] if new_data['bio']
    guest['image'] = new_data['image'] if new_data['image']
  end
end