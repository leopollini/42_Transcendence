require 'webrick/https'
require 'colorize'
require 'openssl'
# require 'faye/websocket'
require_relative 'Oauth'
require_relative 'session'
require_relative 'error_logger'
require_relative 'handle_route'

Dir['/var/common/*.rb'].each { |file| require file }

module WEBrick
  class Log
    alias original_log log

    def log(level, message)
      case level
      when WEBrick::Log::INFO
        message = message.blue
      when WEBrick::Log::WARN
        message = message.yellow
      when WEBrick::Log::ERROR
        message = message.red
      when WEBrick::Log::FATAL
        message = message.bold.red
      end
      original_log(level, message)
    end
  end
end

$stdout.sync = true

SERVICE_NAME = "auth"
PORT = PortFinder::FindPort.new(SERVICE_NAME).getPort

LOGGER = Logger.new(STDOUT)
LOGGER.level = Logger::DEBUG

APP = App.new(OAuthClient.new, LOGGER)

cert_path = File.expand_path("ssl_certs/server.crt", __dir__)
key_path = File.expand_path("ssl_certs/server.key", __dir__)

cert = OpenSSL::X509::Certificate.new(File.read(cert_path))
key = OpenSSL::PKey::RSA.new(File.read(key_path))

server = WEBrick::HTTPServer.new(
  Port: PORT,
  BindAddress: '0.0.0.0',
  DocumentRoot: File.expand_path("../../public", __FILE__),
  RequestCallback: proc { |req, res| res['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0' },
  SSLEnable: true,
  SSLCertificate: cert,
  SSLPrivateKey: key,
  SSLOptions: OpenSSL::SSL::OP_NO_SSLv3 | OpenSSL::SSL::OP_NO_SSLv2,
  SSLVerifyClient: OpenSSL::SSL::VERIFY_NONE,
  SSLVerifyMode: OpenSSL::SSL::VERIFY_NONE,
)

class RootDirManager < WEBrick::HTTPServlet::AbstractServlet
  def do_GET(req, res)
    puts "####", req.request_method, res, "####"
    status, headers, body = APP.call(req.meta_vars)
    res.status = status
    res['Content-Security-Policy'] =
    "default-src 'self'; " \
    "script-src 'self' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; " \
    "style-src 'self' https://fonts.googleapis.com; " \
    "font-src 'self' https://fonts.gstatic.com; " \
    "img-src 'self' data: https://cdn.intra.42.fr; " \
    "connect-src 'self' http://localhost:8008 ws://localhost:6087; " \
    "object-src 'none'";
  
    headers.each { |k, v| res[k] = v }
    log_error_details(req, status, body, LOGGER)
  
    if body.nil?
      res.body = "Internal Server Error"
    else
      if body.is_a?(String)
        res.body = body
      else
        body.each { |chunk| res.body << chunk }
      end
    end
  end
end

server.mount '/', RootDirManager

# server.mount_proc '/ws' do |req, res|
#   puts "websocket creation request"
#   if Faye::WebSocket.websocket?(req.meta_vars)
#     ws = Faye::WebSocket.new(req.meta_vars, nil, { ping: 15 })

#     ws.on :open do |event|
#       puts "created lol!"
#     end

#     ws.on :message do |event|
#       puts "received lol!"
#     end

#     ws.on :close do |event|
#     end

#     # Hand over control to WebSocket — don't send normal HTTP response
#     throw :async
#   else
#     res.status = 400
#     res.body = '{"status":"not a websocket", "success":"false"}'
#   end
# end



# app = lambda do |env|
#   if Faye::WebSocket.websocket?(env)
#     ws = Faye::WebSocket.new(env, nil)

#     ws.on :open do |event|
#       puts "WebSocket opened"
#     end

#     ws.on :message do |event|
#       puts "Received: #{event.data}"
#       ws.send("Echo: #{event.data}")
#     end

#     ws.on :close do |event|
#       puts "WebSocket closed"
#     end

#     return ws.rack_response
#   else
#     req = Rack::Request.new(env)
#     if req.path == '/ws'
#       puts "Non-WebSocket request to /ws"
#     end

#     return [200, { 'Content-Type' => 'text/plain' }, ['Fallback response']]
#   end
# end

# ssl_opts = {
#   SSLEnable: true,
#   SSLCertificate: OpenSSL::X509::Certificate.new(File.read('server.crt')),
#   SSLPrivateKey: OpenSSL::PKey::RSA.new(File.read('server.key')),
#   SSLVerifyClient: OpenSSL::SSL::VERIFY_NONE
# }

# Thread.start {Rack::Handler::WEBrick.run app, Host: '0.0.0.0', Port: 453, **ssl_opts}



set_routes(server)

trap 'INT' do
  LOGGER.info "Shutting down WEBrick server..."
  pid = Process.pid
  LOGGER.info "Terminating process with PID #{pid}".red
  Process.kill('TERM', pid)
  server.shutdown
end

announceAddress
puts "Starting WEBrick server on port #{PORT}...".yellow
server.start
