#!/bin/bash

/var/common/setup_tools.sh

GEMS=("pg" "digest" "dotenv" "openssl" "base64" "colorize" "securerandom")

for gm in "${GEMS[@]}"
do
    if [ -z "$(gem list | grep $gm)" ]; then
        gem install $gm
    fi
done

ruby main.rb
