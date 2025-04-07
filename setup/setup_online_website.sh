#!/bin/bash

RED='\e[31m'
GREEN='\e[32m'
YELLOW='\e[33m'
BLUE='\e[34m'
RESET='\e[0m'  
CERT_DIR="./srcs/trascendence/authentication/ssl_certs"

if ! command -v ufw &> /dev/null
then
    echo -e "\n${YELLOW}ufw non è installato. Procedo con l'installazione...\n${RESET}"
    sudo apt-get update -y
    sudo apt-get install -y ufw
else
    echo -e "\n${GREEN}ufw è già installato.\n${RESET}"
fi

echo -e "${GREEN}\n\n(gli indirizzi ip usabili sono $(hostname -I))\n\n${RESET}"

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

if [ -d "$CERT_DIR" ]; then
    rm -rf "$CERT_DIR"
fi

echo -e "${GREEN}Creating SSL folder...${RESET}"
mkdir -p "$CERT_DIR"

openssl req -new -x509 -days 365 -nodes \
  -out "$CERT_DIR/server.crt" \
  -keyout "$CERT_DIR/server.key" \
  -subj "/C=IT/ST=F/L=MyCity/O=MyOrg/OU=MyDept/CN=localhost"

sudo ufw status verbose