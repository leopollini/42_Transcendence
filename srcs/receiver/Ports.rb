# Ports.rb
module Ports
	@hash = {
	"Docker_name_1" => 8080,
	"lolservice1" => 9090,
  "localhost" => 9090
	}
	def self.hash
		@hash
	end
end