#!/bin/bash

# Simple logger. Just writes down anything that is sent to it, with hour format time

touch /var/www/log/logfile.log
echo -n > /var/www/log/logfile.log
# forever waiting for any message at port 8080
while true;
do
    MSG=$(nc -vlkp $LOGGER_PORT)
    echo "$(date +"%T") $MSG"
    echo "$(date +"%T") $MSG" >> /var/www/log/logfile.log
done
