require "colorize"

def log_error_details(req, status, body, logger)
  body_content = body.to_s

  log_message = "Response Body: #{body_content[0..500]}\n"

  case status
  when 200..299
    logger.info(log_message.green)
  when 300..399
    logger.warn(log_message.yellow)
  when 400..499
    logger.error(log_message.red) 
  when 500..599
    logger.fatal(log_message.bold.red)
  end
end
