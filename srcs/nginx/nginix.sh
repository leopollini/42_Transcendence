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

echo -e "🔧 Testing Nginx configuration..."
nginx -t || { echo "Nginx configuration test failed."; exit 1; }

echo -e "🧹 Cleaning up old PID file..."
rm -f /var/run/nginx.pid

echo -e "🔄 Restarting Nginx..."
nginx -s reload || { echo "Failed to reload Nginx."; exit 1; }

echo -e "✅ Nginx restarted successfully."
