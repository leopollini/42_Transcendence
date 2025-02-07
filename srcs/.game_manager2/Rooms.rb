
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
	  puts "Created new room for " + p1 +"; id: " + @id.to_s if DEBUG_MODE
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
  def beginMatch()

  end
	# def getSockets()
	# 	return [@socket_p1, @socket_p2]
	# end
	# def getLastUpdate()
	# 	return @updated
	# end
	# def update
	# 	@updated = Time.now.to_i
	# end
	def status()
		return @status
	end
	def getId()
		return @id
	end
end

class Rooms_lst
	def initialize()
		@mutex = Mutex.new
		@free_play_rooms = []
    @assigned_rooms = []
		@active_rooms = []
	end
	
end