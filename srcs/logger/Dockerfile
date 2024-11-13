FROM ruby:3.3
EXPOSE $PORT_LOGGER
COPY main.rb /var/www/
RUN chmod +x /var/www/main.rb
CMD [ "ruby", "/var/www/main.rb" ]
# CMD ["ls", "/var/www/common"]
