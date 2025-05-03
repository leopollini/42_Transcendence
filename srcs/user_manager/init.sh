#!/bin/bash

/var/common/setup_tools.sh

GEMS=("pg" "digest" "dotenv" "colorize" "securerandom")

for gm in "${GEMS[@]}"
do
    if [ -z "$(gem list | grep $gm)" ]; then
        gem install $gm
    fi
done

ruby main.rb