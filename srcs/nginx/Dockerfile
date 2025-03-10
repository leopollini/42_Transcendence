FROM nginx:latest

COPY ./nginx.conf /etc/nginx/nginx.conf

EXPOSE 80 443

COPY ./crypted_data/* /etc/nginx/ssl/
COPY ./srcs/nginx/nginx.conf /etc/nginx/conf.d/
COPY ./server.sh /etc/nginx/
COPY ./nginix.sh /etc/nginx/
COPY ./create_certificate.sh /etc/nginx/

RUN chmod +x /server.sh

RUN chmod +x /nginx.sh
