FROM ruby:3.3
COPY main.rb /var/www/
RUN chmod +x /var/www/main.rb
EXPOSE 9001
CMD [ "ruby", "/var/www/main.rb" ]
