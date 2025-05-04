#!/bin/bash

/var/common/setup_tools.sh

gem install bundler

bundle install --jobs=4

# GEMS=('em-websocket' 'colorize' 'json')

# for gm in "${GEMS[@]}"
# do
#     if [ -z "$(gem list | grep $gm)" ]; then
#         gem install $gm
#     fi
# done

ruby main.rb