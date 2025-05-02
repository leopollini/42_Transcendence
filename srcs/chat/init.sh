#!/bin/bash

/var/common/setup_tools.sh

GEMS=('webrick-websocket' 'colorize' 'json' 'faye-websocket')

for gm in "${GEMS[@]}"
do
    if [ -z "$(gem list | grep $gm)" ]; then
        gem install $gm
    fi
done

ruby main.rb
