#!/bin/bash

if [ -f /var/www/nginx/.env ]; then
    source /var/www/nginx/.env
else
    echo -e "🔴 .env file not found in /var/www/nginx!"
    exit 1
fi

cd /etc/nginx/

mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled/

rm -f ./sites-enabled/nginx.conf
ln -s ./sites-available/nginx.conf ./sites-enabled/

echo -e "🧹 Cleaning up old PID file..."
if [ ! -d /var/run/nginx ]; then
    mkdir -p /var/run/nginx
fi

if [ -f /var/run/nginx.pid ]; then
    if [ -s /var/run/nginx.pid ]; then
        echo -e "🔴 Stopping Nginx and cleaning up PID file..."
        rm -f /var/run/nginx.pid
    else
        echo -e "⚠️ Warning: PID file is empty."
    fi
fi

echo -e "🔧 Testing Nginx configuration..."
nginx -t || { echo "Nginx configuration test failed."; exit 1; }

echo -e "🔄 Reloading Nginx configuration..."

if [ -f /var/run/nginx.pid ] && [ -s /var/run/nginx.pid ]; then
    nginx -s reload || { echo "Failed to reload Nginx."; exit 1; }
else
    echo -e "⚠️ Nginx is not running or PID file is invalid, starting Nginx..."
    nginx || { echo "Failed to start Nginx."; exit 1; }
fi

nginx || { echo "Failed to start Nginx."; exit 1; }

echo -e "✅ Nginx started successfully."