require 'timeout'
require 'webrick'
require 'webrick/https'
require 'openssl'

load(File.file?('/var/common/Ports.rb') ? '/var/common/Ports.rb' : '../common_tools/tools/Ports.rb')

load(File.file?('/var/common/RequestUnpacker.rb') ? '/var/common/RequestUnpacker.rb' : '../common_tools/tools/RequestUnpacker.rb')

$stdout.sync = true
SERVICE_NAME = 'receiver'
PORT = PortFinder::FindPort.new(SERVICE_NAME).getPort   # 8008

class Receiver < WEBrick::HTTPServlet::AbstractServlet
  def service(req, res)
    begin
      res.status = 200

      # return res.body = {"status" => "receiver: empty request", 'success' => 'true'}.to_json if res.body.to_s == ""
      # return res.body = "{}" if res.body.to_s == ""
      if req.body
        begin
          json_body = JSON.parse req.body.to_s
        rescue => r
          res.body = {"status" => "receiver: not a valid json string (#{r.class})", 'success' => 'false'}.to_json
          puts "bad request body: '#{req.body}'"
          return
        end
      else
        json_body = {}
      end

      method = req.request_method
      puts "called method #{method}"
      json_body['method'] = method

      return res.body = {"status" => "receiver: empty request", 'success' => 'false'}.to_json if method.nil?

      puts "####", json_body, "####"
      
      res.body = SimpleServer.method_req method, json_body
      res.status = 500 if res.body.index '"success": "false"'
    rescue => r
      res.body = {"status" => "Server Error: #{r.to_s}", "success" => "false"}.to_json
      puts "server error:", req.body
    # raise r
    end
  end
end


cert_path = File.expand_path("ssl_certs/server.crt", __dir__)
key_path = File.expand_path("ssl_certs/server.key", __dir__)

cert = OpenSSL::X509::Certificate.new(File.read(cert_path))
key = OpenSSL::PKey::RSA.new(File.read(key_path))

server = WEBrick::HTTPServer.new(
  Port: PORT,
  BindAddress: '0.0.0.0',
  SSLEnable: true,
  RequestCallback: proc { |req, res| res['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'; res['Access-Control-Allow-Origin'] = '*'; res['Access-Control-Allow-Methods'] = '*'},
  SSLCertificate: cert,
  SSLPrivateKey: key,
  SSLOptions: OpenSSL::SSL::OP_NO_SSLv3 | OpenSSL::SSL::OP_NO_SSLv2,
  SSLVerifyClient: OpenSSL::SSL::VERIFY_NONE,
  SSLVerifyMode: OpenSSL::SSL::VERIFY_NONE,
)

# server = WEBrick::HTTPServer.new(
#   Port: PORT,
#   BindAddress: '0.0.0.0',
#   DocumentRoot: File.expand_path("../../public", __FILE__),
#   RequestCallback: proc { |req, res| res['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'; res['Access-Control-Allow-Origin'] = '*'; res['Access-Control-Allow-Methods'] = '*'}
# )

server.mount '/', Receiver

trap 'INT' do
  pid = Process.pid
  LOGGER.info "Terminating process with PID #{pid}".red
  Process.kill('TERM', pid)
  server.shutdown
end

server.start
