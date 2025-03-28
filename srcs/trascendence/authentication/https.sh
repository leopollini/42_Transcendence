#!/bin/bash

echo "Se non esiste creo cartella"
mkdir -p "./ssl_certs"

echo "🔹 Generazione certificato SSL auto-firmato..."
openssl req -new -x509 -days 365 -nodes -out "./ssl_certs/server.crt" -keyout "./ssl_certs/server.key" -subj "/C=IT/ST=F/L=MyCity/O=MyOrg/OU=MyDept/CN=localhost"

echo "✅ Certificati creati!"
ls -l "$SSL_DIR"
echo "📂 Certificato: ./ssl_certs/server.crt"
echo "🔑 Chiave: ./ssl_certs/server.key"

echo "==============================="
echo "🔹 Verifica dei certificati:"

openssl x509 -in ./ssl_certs/server.crt -noout -text

echo "==============================="
echo "Script completato. Avvio server..."
