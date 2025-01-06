
module Code
	ENTER_AS_PLAYER1 = 1
	ENTER_AS_PLAYER2 = 2
	NEW_ROOM_CREATED = 3 # room creator is always player 1

	DUPLICATE_USERNAME = 4

	FAILED = 0
end

module Status
#post-connection
	P1_STATUS = 1
	P2_STATUS = 2			# 0: playing, -1: not paired, 1: disconnected
	IN_PROGRESS = 3
	PAUSED = 4
	
	BROKEN = 0
end

class Room
	@@ids = 0
	def initialize(p1 = "", p2 = "", id)
		raise "Room cretor: invalid input" if p1.nil? || p2.nil?
		@player1 = p1.to_s
		@player2 = p2.to_s
		@socket_p1 = nil
		@socket_p2 = nil
		@status = [1, 1, false, false, false]
		@updated = Time.now.to_i
		@mutex = Mutex.new
		@id = @@ids
		@@ids = @@ids + 1
	puts "Created new room for " + p1 +"; id: " + @id.to_s
	end
	def status(s = -1)
		if s != -1
			@status = s
		end
		return @status
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
		@rooms = []
    @active_rooms = []
	end
  def addToActive(room)
    @mutex.synchronize do
      @active_rooms.append room
    end
  end
	def purgeRooms()
    @mutex.synchronize do
      t = @rooms.clone
      t.each do | r |
        if Time.now.to_i > r.getLastUpdate + ROOM_LIFETIME
          puts "Deleting room " + r.getId.to_s
          @rooms.delete r
        end
      end
    end
	end
	def please(client, playername = "", opponent = "")	# random opponent, tournament mode or specific opponent
		@mutex.synchronize do
			# purgeRooms
			(@active_rooms + @rooms).each do | room | # SHOULD check active rooms before free roms
				if room.getPlayers()[0] == playername && (opponent.empty? || room.getPlayers()[1] == opponent)
					return [room, Code::DUPLICATE_USERNAME] if room.getStatus[Status::P1_STATUS] == 0
					return [room, Code::ENTER_AS_PLAYER1]
				end
				if room.getPlayers()[1] == playername && (opponent.empty? || room.getPlayers()[0] == opponent)
					return [room, Code::DUPLICATE_USERNAME] if room.getStatus[Status::P2_STATUS] == 0
					return [room, Code::ENTER_AS_PLAYER2]
				end
			end
			@rooms.each do | room | # look for random free waiting room
        if room.getPlayers()[1] == "" && (opponent == "" )
          room.setPlayer2 playername
          return [room, Code::ENTER_AS_PLAYER2]
        end
      end
			# reaches this if room for player does not exist
			room = Room.new playername, opponent
			@rooms.append room
			return [room, Code::NEW_ROOM_CREATED]
		end
	end
end