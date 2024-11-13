# RequestUnpacker.rb

# usage: RequestUnpacker::Unpacker.new.unpack(msg)
module RequestUnpacker
  class Unpacker
    def initialize()
    end
    DEFAULT_RETURN_PAGE = {"method" => "request_page", "page" => "index.html"}
    def add_query_string(qs="", bobj={})
      vars = qs.split("&")
      vars.each do |s|
        bobj[s[..s.index("=").to_i - 1]] = s[s.index("=").to_i + (s.index("=") ? 1 : 0)..]
      end
    end
    def add_header(head="", bobj={})
      vars = head.split("\r\n")
      vars.each do |s|
        bobj[s[..s.index(":").to_i - 1]] = s[s.index(":").to_i + (s.index(":") ? 2 : 0)..]
      end
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
    
      puts "request: '" + request.to_s + "'" + " for " + url +". QS: '" + query_string.to_s + "'" if DEBUG_MODE
      head = msg[msg.index("\r\n") + 2..msg.index("\r\n\r\n").to_i - 1] if msg.index("\r\n")
      begin
        bodyobj = JSON.parse msg[msg.index("\r\n\r\n") + 4..]
      rescue JSON::ParserError => r
        bodyobj = DEFAULT_RETURN_PAGE
      end
    
      bodyobj["page"] =	url.to_s if request == "GET" && url
      add_query_string(query_string, bodyobj) if query_string
      add_header(head, bodyobj)
      return bodyobj
    end
  end
end