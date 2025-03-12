FROM nginx:latest

EXPOSE 8080 443

RUN apt-get update && apt-get install -y procps && rm -rf /var/lib/apt/lists/*

COPY ./* /etc/nginx/

RUN chmod +x /server.sh

RUN chmod +x /nginx.sh