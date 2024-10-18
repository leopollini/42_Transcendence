FROM debian:buster
COPY logger.sh /var/www/
RUN chmod +x /var/www/logger.sh
RUN apt-get update
RUN apt-get install -y netcat
EXPOSE 8080
ENTRYPOINT [ "/var/www/logger.sh" ]
# CMD ["bash", "/var/www/logger.sh"]
