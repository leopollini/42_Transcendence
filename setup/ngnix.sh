#!/bin/bash

echo "Aggiornamento dei pacchetti..."
sudo apt update -y

if command -v nginx &> /dev/null
then
    echo "Nginx è già installato."
else
    echo "Installazione di Nginx..."
    sudo apt install -y nginx

    if ! command -v nginx &> /dev/null
    then
        echo "Errore: Nginx non è stato installato correttamente."
        exit 1
    fi
fi

echo "Nginx è pronto all'uso!"
