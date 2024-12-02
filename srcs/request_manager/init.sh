#!/bin/bash

if [ -z "$(gem list | grep pg)" ]; then
    gem install pg
fi
if [ -z "$(gem list | grep digest)" ]; then
    gem install digest
fi

ruby main.rb
