require 'socket'

s = TCPSocket.new "localhost", 8080
s.puts("asjhdkahsjd")
s.close
sleep 2