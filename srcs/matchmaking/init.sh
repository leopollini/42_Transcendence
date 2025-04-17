#!/bin/bash

/var/common/setup_tools.sh

GEMS=("pg" "digest" "colorize")

for gm in "${GEMS[@]}"
do
    if [ -z "$(gem list | grep $gm)" ]; then
        gem install $gm
    fi
done

ruby main.rb
