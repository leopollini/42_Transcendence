FROM ruby:3.3
COPY main.rb /var/www/
RUN chmod +x /var/www/main.rb
EXPOSE 8008
CMD [ "ruby", "/var/www/main.rb" ]
