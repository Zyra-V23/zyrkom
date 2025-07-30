#!/bin/bash

echo "🛑 Deteniendo túnel..."

# Detener Tor
echo "🧅 Deteniendo Tor..."
pkill -f tor || taskkill //F //IM tor.exe 2>/dev/null

# Desconectar Mullvad
if command -v mullvad &> /dev/null; then
    echo "🔓 Desconectando Mullvad VPN..."
    mullvad disconnect
else
    echo "⚠️ Mullvad CLI no disponible"
fi

echo "✅ Túnel detenido"
