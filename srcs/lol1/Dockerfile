FROM debian:buster
COPY lol.sh /var/www/
RUN chmod +x /var/www/lol.sh
RUN apt-get update
RUN apt-get install -y netcat
EXPOSE 9090
ENTRYPOINT [ "/var/www/lol.sh" ]
# CMD ["bash", "/var/www/lol.sh"]
