
module Code
	SUCCESS = 1
  RECONNECTED = 2
	NEW_ROOM_CREATED = 3 # room creator is always player 1

	DUPLICATE_USERNAME = 4
  TOURNAMENT_ROOM_NOT_CREATED = 6
  RECONNECTION_FAILED = 5

	FAILED = 0
end

module Status
#post-connection
	P1_STATUS = 1
	P2_STATUS = 2			# 0: playing, -1: not paired, 1: disconnected/paired
	IN_PROGRESS = 3   # 0: in progress, -1: waiting for players, 1: finished
	PAUSED = 4
	
	BROKEN = 0
end

class Room
	@@ids = 0
	def initialize(p1, p2 = "", id)
		raise "Room cretor: invalid input" if p1.nil? || p2.nil? || p1.empty?
		@player1 = p1.to_s
		@player2 = p2.to_s
		@socket_p1 = nil
		@socket_p2 = nil
		@status = [false, 1, p2.empty? ? -1 : 1, -1, false]
		@updated = Time.now.to_i
		@mutex = Mutex.new
		@id = @@ids
		@@ids = @@ids + 1
	  puts "Created new room for " + p1 + (p2.empty? ? "" : (" and " + p2)) + "; id: " + @id.to_s
	end
	def status(s = -1)
		if s != -1
			@status = s
		end
		return @status
	end
  def disconnected(playername, other = nil)
    @mutex.synchronize do
      p = amIP1 playername
      @status[p ? Status::P1_STATUS : Status::P2_STATUS] = 1
      other.puts '{"status":"opponent_disconnected","success":"false","paused":"false"}' if other && !other.closed?
      if @status[!p ? Status::P1_STATUS : Status::P2_STATUS] != 0
        puts "Room is now empty!!! Pausing game"
        @status[Status::PAUSED] = true
      end
    end
  end
  def reconnected(playername, client)
    @mutex.synchronize do
      p = amIP1 playername
      @status[p ? Status::P1_STATUS : Status::P2_STATUS] = 0
      msg = '{"opponent":"' + getOpponent(playername) + '""status":"reconnected","success":"true"'
      if @status[!p ? Status::P1_STATUS : Status::P2_STATUS] != 0
        msg << ',"paused":"true"'
      puts "game is paused because of missing player"
      else
        msg << ',"pauesd":"false"'
      puts "game is unpaused because all players are here!"
        @status[Status::PAUSED] = false
      end
      msg << '}'
      client.puts msg
    end
  end
	def getOpponent(playername)
		return (playername == @player1 ? @player2 : @player1)
  end
	def getOpponentSocket(clientsock)
		return (clientsock == @socket_p1 ? @socket_p2 : @socket_p1)
  end
  def amIP1(playername)
    return playername == @player1 ? true : false
  end
	def setPlayer2(playername)
		@player2 = playername.to_s
	end
	def getPlayers()
		return [@player1, @player2]
	end
	def setSocket(sock, playername = "")
		@mutex.synchronize do
			@socket_p1 = sock if playername == @player1
			@socket_p2 = sock if playername == @player2
		end
	  return [@socket_p1, @socket_p2]
	end
	def getSockets()
		return [@socket_p1, @socket_p2]
	end
	def getLastUpdate()
		return @updated
	end
	def update
		@updated = Time.now.to_i
	end
	def getId()
		return @id
	end
	def getStatus()
		return @status
	end
end

class Rooms_lst
	def initialize()
		@mutex = Mutex.new
		@waiting_rooms = []
    @assigned_rooms = []
    @active_rooms = []
    @tournament_rooms = []
  end
  def activateRoom(room)
    raise "orcam erda" if room.nil?
    return if @active_rooms.include? room
    raise "room not assigned" if !@assigned_rooms.include? room
    @mutex.synchronize do
      @assigned_rooms.delete room
      @active_rooms.append room
    end
    return room
  end
  def moveRoom(room, to, from = nil)
    raise "orcam erda" if room.nil?
    from.delete room if from
    to.append room if room
    return room
  end
	def purge(room = nil)
    return if room.nil?
    @waiting_rooms.delete room if @waiting_rooms.includes? room
    [@waiting_rooms, @assigned_rooms, @active_rooms, @tournament_rooms].each do | a |
      next if !a.include? room

    end
	end
  def findYourRoom(room, playername, opponent)
    if room.getPlayers()[0] == playername && (opponent.empty? || room.getPlayers()[1] == opponent)
      return [room, Code::DUPLICATE_USERNAME] if room.getStatus[Status::P1_STATUS] == 0
      return [room, Code::SUCCESS]
    end
    if room.getPlayers()[1] == playername && (opponent.empty? || room.getPlayers()[0] == opponent)
      return [room, Code::DUPLICATE_USERNAME] if room.getStatus[Status::P2_STATUS] == 0
      return [room, Code::SUCCESS]
    end
    return nil
  end
  def getRoomsCount(include_tournament = true)
    return @waiting_rooms.count + @assigned_rooms.count + @active_rooms.count + (include_tournament ? @tournament_rooms.count : 0)
  end
	def please(info, client, playername = "", opponent = "")	# random opponent, tournament mode or specific opponent
		@mutex.synchronize do
			# purgeRooms

# if the player is reconnecting
      # if info["reconnecting"] == "true"
        @active_rooms.each do | room |
          t = findYourRoom room, playername, opponent
          if t
            room.reconnected playername, client
          puts "Found in active rooms"
            return [t[0], t[1] == Code::SUCCESS ? Code::RECONNECTED : t[1]]
          end
        end
        return [nil, Code::RECONNECTION_FAILED] if info["reconnecting"] == "true" # in case room is not found
      # end
# if the player is looking for his tournament room (opponent may be specified)
      if info["tournament"] == "true"
			@tournament_rooms.each do | room |
          t = findYourRoom room, playername, opponent
          moveRoom room, @assigned_rooms if t
          return t if t
        end
        return [nil, Code::TOURNAMENT_ROOM_NOT_CREATED]  # in case room is not found
      end
# if the player is already matched
			@assigned_rooms.each do | room |
        t = findYourRoom room, playername, opponent
        puts "room found? : " + t.class.to_s
        return t if !t.nil?
			end
# if the player is looking for a random game
			@waiting_rooms.each do | room | # look for random free waiting room
        if room.getPlayers()[0] == playername
          puts "sent to his room"
          return [room, Code::DUPLICATE_USERNAME] if room.getStatus[Status::P1_STATUS] == 0
          return [room, Code::SUCCESS]
        end
        if room.getPlayers()[1] == "" && (opponent == "") && room.getPlayers()[0] != playername
          room.setPlayer2 playername
        puts "inserted in free room"
          moveRoom room, @assigned_rooms, @waiting_rooms
          return [room, Code::SUCCESS]
        end
      end
# reaches this if room for player does not exist
			room = Room.new playername, opponent
      if opponent.empty?
        @waiting_rooms.append room
      else
        @assigned_rooms.apend room
      end
			return [room, Code::NEW_ROOM_CREATED]
		end
	end
end