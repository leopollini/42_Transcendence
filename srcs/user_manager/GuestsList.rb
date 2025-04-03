

MAX_GUEST_COUNT = 10

require 'openssl'
require 'base64'
require 'dotenv'
require 'securerandom'
require 'colorize'

Dotenv.load

def encrypt_token(token)
  token = token.to_s.force_encoding('BINARY')

  cipher = OpenSSL::Cipher.new('AES-256-CBC')
  cipher.encrypt

  key = ENV['ENCRYPTION_KEY'].to_s.ljust(32, "\0")[0, 32]
  if key.nil? || key.empty?
    raise "Error: ENCRYPTION_KEY is missing or empty"
    return nil
  end
  cipher.key = key
  
  iv = cipher.random_iv

  encrypted = cipher.update(token) + cipher.final

  encrypted_token = Base64.strict_encode64(iv + encrypted)
  return encrypted_token
end

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
    raw_token = Digest::SHA256.hexdigest(username)
    encrypted_token = encrypt_token(raw_token)
    @guests[@counter] = {'username' => username, 'created' => Time.now.to_i, 'deleted' => -1, 'token' => Digest::SHA256.hexdigest(username)}
    @guests[@counter]['bio'] = data['bio'].to_s
    @guests[@counter]['image'] = data['image'].to_s
    puts "added #{username}! Token #{@guests[@counter]['token']}".green
    {'status' => 'success', 'success' => 'true', 'token' => encrypted_token}
  end
  def del_guest(username)
    return DEFAULT_MISSING_PARAM.clone if username.class != "".class
    return {'status' => "#{username} (guest) does not exist", 'success' => 'false'} unless @index[username]

    @guests[@index[username]]['deleted'] = Time.now.to_i
    @index.delete username
    puts "removed #{username}!".red
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
  def get_token_name(decripted_token)
    unless @guests.empty?
      @guests[1..].each do |entry|
        next if entry.nil?
        if entry['token'].to_s === decripted_token.to_s 
          puts "user found".green
          return {
            'status' => 'success',
            'success' => 'true',
            'username' => entry['username'],
            'bio' => entry['bio'],
            'image' => entry['image']
          }
        end
      end
      puts "invalid token".red
      return {'status' => 'invalid token', 'success' => 'false'}
    else
      puts "no user".red
      return {'status' => 'no users found', 'success' => 'false'}
    end
  end

  def del_guest_by_token(token)
    begin
      index = @guests.find_index do |guest|
        guest && guest.is_a?(Hash) && guest['token'] == token
      end
      if index
        @guests.delete_at(index)
        @index.delete token
        puts "removed guest!".red
        return {'status' => 'success', 'success' => 'true'}
      else
        return {'status' => " (guest) does not exist", 'success' => 'false'}
      end
    rescue => r
      puts "Errore: #{r.message}".red
      puts "Backtrace: #{r.backtrace.join("\n")}".red
    end
  end
end