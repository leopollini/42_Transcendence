#!/bin/bash

GEMS=("pg")

for gm in $GEMS
do
    if [ -z "$(gem list | grep $gm)" ]; then
        gem install $gm
    fi
done

ruby main.rb
