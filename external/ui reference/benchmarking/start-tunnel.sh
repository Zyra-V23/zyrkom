#!/bin/bash

echo "🚀 Iniciando túnel completo..."

# Conectar Mullvad VPN
if command -v mullvad &> /dev/null; then
    echo "🔒 Conectando Mullvad VPN..."
    mullvad connect
    sleep 3
    mullvad status
else
    echo "⚠️ Mullvad CLI no disponible"
fi

# Iniciar Tor
echo "🧅 Iniciando Tor..."
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    /c/tor/tor.exe -f /c/tor/torrc &
else
    tor -f /etc/tor/torrc &
fi

echo "⏳ Esperando que Tor se inicie..."
sleep 10

# Verificar hidden service
if [ -f "tor_hidden_service/hostname" ]; then
    ONION_ADDRESS=$(cat tor_hidden_service/hostname)
    echo "🎉 Túnel establecido!"
    echo "🧅 Dirección Onion: $ONION_ADDRESS"
    echo "🌐 Acceso local: http://localhost:3000"
    echo "🔗 Acceso Tor: http://$ONION_ADDRESS"
else
    echo "⚠️ Hidden service aún no está listo. Espera unos minutos más."
fi

echo "✅ Túnel completo activo"
