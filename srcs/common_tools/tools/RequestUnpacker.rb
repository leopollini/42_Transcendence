# RequestUnpacker.rb

require 'json'

# usage: RequestUnpacker::Unpacker.new.unpack(msg)
module RequestUnpacker
  class Unpacker
    def initialize()
    end
    DEFAULT_RETURN_PAGE = {"method" => "GET", "page" => "/"}
    def query_string_json(qs="")
      obj = {}
      vars = qs.split("&")
      vars.each do |s|
        t = s.index("=").to_i
        obj[s[..t - 1]] = s[t + (t ? 1 : 0)..]
      end
      return obj
    end

    def header_json(head="")
      obj = {}
      vars = head.split("\r\n")
      vars.each do |s|
        t = s.index(":").to_i
        obj[s[..t - 1]] = s[t + (t ? 2 : 0)..]
      end
      return obj
    end

    def get_req_details(fr)
      puts "# creating request" if DEBUG_MODE
      request = fr[0..fr.index(" ").to_i - 1]
      fr = fr[request.size.to_i + 1..-1]
      return [request] if fr.nil?
      puts "# creating url" if DEBUG_MODE
      t = fr.index("?")
      url = (t ? fr[0, t] : fr[0..fr.index(" ").to_i-1])
      fr = fr[url.size.to_i + 1..-1]
      return [request, url] if fr.nil? || t.nil?
      puts "# creating qs" if DEBUG_MODE
      qs = fr[0..fr.index(" ").to_i - 1]
      return [request, url, qs]
    end

    def unpack(msg)
      (request, url, query_string) = get_req_details(msg[0,msg.index("\n")])
      bodyobj = {}
    
      puts "request: '" + request.to_s + "'" + " for " + url +". QS: '" + query_string.to_s + "'" if DEBUG_MODE
      head = msg[msg.index("\r\n") + 2..msg.index("\r\n\r\n").to_i - 1] if msg.index("\r\n")
      begin
        bodyobj = JSON.parse msg[msg.index("\r\n\r\n").to_i + 4..]
      rescue JSON::ParserError => r
        bodyobj["method"] = (request ? request.to_s : "GET")
        bodyobj["body_text"] = msg[msg.index("\r\n\r\n").to_i + 4..] if msg.index("\r\n\r\n")
        bodyobj["page"] = (!url || url.to_s == "/" ? "index.html" : url)
        # puts bodyobj.to_s
      end
      # print "\n\n"
      bodyobj["query_string"] = query_string_json(query_string) if query_string
      bodyobj["header"] = header_json(head) if head
      # puts
      # puts bodyobj["header"].to_s
      # puts bodyobj["method"].to_s
      # print "\n\n"
      if bodyobj["method"].to_s == "OPTIONS"
        bodyobj["method"] = bodyobj["header"]["Access-Control-Request-Method"].to_s
        puts "new method: " + bodyobj["method"] if DEBUG_MODE
      end rescue r
      return bodyobj
    end
  end
end