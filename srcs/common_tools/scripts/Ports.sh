#!/bin/bash
# Ports notation inside .env file (sample ports 8080 and 9090):
#   PORTS_VAR=("Docker name 1" "8080" "Docker 2" "9090" ...)
# key value for map MUST begin with capital and MUST NOT contain spaces

export -a "$(cat $2 | grep -v '#' | xargs)"

touch $1/Ports.rb
printf "# Ports.rb\nmodule Ports\n\t@hash = {\n" >> $1/Ports.rb
t=""
for i in ${PORTS_VAR[@]}; do
    if [[ -z ${t[0]} ]]; then
        t=$i
        continue
    fi
    printf "\t\"$t\" => \"$i\",\n" >> $1/Ports.rb
    t=""
done
printf "\t}\n\tdef self.hash\n\t\t@hash\n\tend\nend" >> $1/Ports.rb