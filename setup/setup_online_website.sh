#!/bin/bash

RED='\e[31m'
GREEN='\e[32m'
YELLOW='\e[33m'
BLUE='\e[34m'
RESET='\e[0m'  

#echo -e "\n${YELLOW}Aggiornamento dei pacchetti...\n${RESET}"
#sudo apt update -y
#
#if command -v nginx &> /dev/null
#then
#    echo -e "\n${GREEN}Nginx è già installato.\n${RESET}"
#else
#    echo -e "\n${YELLOW}Installazione di Nginx...\n${RESET}"
#    sudo apt install -y nginx
#
#    if ! command -v nginx &> /dev/null
#    then
#        echo -e "\n${RED}Errore: Nginx non è stato installato correttamente.\n${RESET}"
#        exit 1
#    fi
#fi
#
#echo -e "\n${GREEN}Nginx è pronto all'uso!\n${RESET}"

if ! command -v ufw &> /dev/null
then
    echo -e "\n${YELLOW}ufw non è installato. Procedo con l'installazione...\n${RESET}"
    sudo apt-get update -y
    sudo apt-get install -y ufw
else
    echo -e "\n${GREEN}ufw è già installato.\n${RESET}"
fi

echo -e "${GREEN}\n\n(Il primo ip e l'usabile $(hostname -I))\n\n${RESET}"

echo -e "\n${YELLOW}Configurando il firewall per consentire il traffico sulla porta 443...\n${RESET}"
sudo ufw allow 443
sudo ufw reload

if ! sudo ufw status | grep -q "active"
then
    echo -e "\n${YELLOW}Abilitando il firewall...\n${RESET}"
    sudo ufw enable
else
    echo -e "\n${GREEN}Il firewall è già abilitato.\n${RESET}"
fi

echo -e "\n${GREEN}Firewall configurato con successo\n${RESET}"
sudo ufw status verbose
