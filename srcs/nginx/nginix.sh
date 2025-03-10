#!/bin/bash

if [ -f /var/www/nginx/.env ]; then
    source /var/www/nginx/.env
else
    echo -e "🔴 .env file not found in /var/www/nginx!"
    exit 1
fi


rm /etc/nginx/sites-enabled/finaltrascendence.conf
ln -s /etc/nginx/sites-available/finaltrascendence.conf /etc/nginx/sites-enabled/

echo -e "$YELLOW Testing Nginx configuration...$RESET"
nginx -t || handle_error "Nginx configuration test failed."

echo -e "$YELLOW Restarting Nginx...$RESET"
systemctl restart nginx || handle_error "$RED Failed to restart Nginx.$RESET"

echo -e "$GREEN Nginx restarted successfully.$RESET"
