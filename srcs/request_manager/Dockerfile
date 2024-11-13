FROM ruby:3.3
COPY main.rb /var/www/
RUN chmod +x /var/www/main.rb
RUN gem install pg
EXPOSE 9000
CMD [ "ruby", "/var/www/main.rb" ]
