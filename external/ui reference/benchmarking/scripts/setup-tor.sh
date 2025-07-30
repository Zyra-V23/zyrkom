#!/bin/bash

# Script para configurar Tor automáticamente
# Compatible con Windows (Git Bash) y Linux

echo "🧅 Configurando Tor para túneles de anonimato..."

# Detectar sistema operativo
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    echo "📱 Sistema detectado: Windows"
    TOR_DIR="/c/tor"
    TOR_EXE="$TOR_DIR/tor.exe"
    
    # Verificar si Tor está instalado
    if [ ! -f "$TOR_EXE" ]; then
        echo "⬇️ Descargando Tor Browser Bundle..."
        mkdir -p "$TOR_DIR"
        
        # Descargar Tor Browser (versión estable)
        curl -L "https://dist.torproject.org/torbrowser/13.0.8/tor-expert-bundle-windows-x86_64-13.0.8.tar.gz" -o "/tmp/tor.tar.gz"
        
        echo "📦 Extrayendo Tor..."
        tar -xzf "/tmp/tor.tar.gz" -C "$TOR_DIR" --strip-components=1
        
        echo "✅ Tor instalado en $TOR_DIR"
    else
        echo "✅ Tor ya está instalado"
    fi
    
    TORRC_PATH="$TOR_DIR/torrc"
    
else
    echo "📱 Sistema detectado: Linux/Unix"
    
    # Instalar Tor si no está disponible
    if ! command -v tor &> /dev/null; then
        echo "⬇️ Instalando Tor..."
        
        if command -v apt-get &> /dev/null; then
            sudo apt-get update
            sudo apt-get install -y tor
        elif command -v yum &> /dev/null; then
            sudo yum install -y tor
        elif command -v pacman &> /dev/null; then
            sudo pacman -S tor
        else
            echo "❌ No se pudo instalar Tor automáticamente. Instálalo manualmente."
            exit 1
        fi
    else
        echo "✅ Tor ya está instalado"
    fi
    
    TORRC_PATH="/etc/tor/torrc"
    TOR_EXE="tor"
fi

# Crear directorio para hidden service
HIDDEN_SERVICE_DIR="$(pwd)/tor_hidden_service"
mkdir -p "$HIDDEN_SERVICE_DIR"

# Configurar torrc
echo "⚙️ Configurando Tor..."

cat > "$TORRC_PATH" << EOF
# Configuración Tor para RustAttack
SocksPort 9050
ControlPort 9051
HashedControlPassword 16:872860B76453A77D60CA2BB8C1A7042072093276A3D701AD684053EC4C

# Hidden Service para localhost:3000
HiddenServiceDir $HIDDEN_SERVICE_DIR
HiddenServicePort 80 127.0.0.1:3000

# Configuraciones de seguridad
CookieAuthentication 1
DataDirectory $(pwd)/tor_data

# Configuraciones de rendimiento
CircuitBuildTimeout 10
LearnCircuitBuildTimeout 0
MaxCircuitDirtiness 10 minutes

# Logging
Log notice file $(pwd)/tor.log
EOF

echo "✅ Configuración Tor completada"

# Verificar Mullvad CLI
echo "🔒 Verificando Mullvad CLI..."

if command -v mullvad &> /dev/null; then
    echo "✅ Mullvad CLI encontrado"
    
    # Verificar estado de conexión
    MULLVAD_STATUS=$(mullvad status 2>/dev/null || echo "Disconnected")
    echo "📊 Estado Mullvad: $MULLVAD_STATUS"
    
    # Listar ubicaciones disponibles
    echo "🌍 Ubicaciones Mullvad disponibles:"
    mullvad relay list | head -10
    
else
    echo "⚠️ Mullvad CLI no encontrado"
    echo "📥 Descarga Mullvad desde: https://mullvad.net/download/"
    echo "💡 Después de instalar, ejecuta: mullvad account login [tu-numero-cuenta]"
fi

# Crear script de inicio rápido
cat > "start-tunnel.sh" << 'EOF'
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
EOF

chmod +x start-tunnel.sh

# Crear script de parada
cat > "stop-tunnel.sh" << 'EOF'
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
EOF

chmod +x stop-tunnel.sh

echo ""
echo "🎉 Configuración completada!"
echo ""
echo "📋 Comandos disponibles:"
echo "  ./start-tunnel.sh  - Iniciar túnel completo"
echo "  ./stop-tunnel.sh   - Detener túnel"
echo ""
echo "📁 Archivos creados:"
echo "  - $TORRC_PATH (configuración Tor)"
echo "  - tor_hidden_service/ (directorio hidden service)"
echo "  - start-tunnel.sh (script de inicio)"
echo "  - stop-tunnel.sh (script de parada)"
echo ""
echo "🔧 Para usar en la aplicación:"
echo "  1. Ejecuta: npm start"
echo "  2. Abre RustAttack"
echo "  3. Usa los controles de túnel en la interfaz"
echo "" 