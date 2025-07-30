# 🎮 Zyrkom UI - Windows 95 Style

Una interfaz gráfica estilo Windows 95 para el framework Zyrkom Zero-Knowledge Musical Physics.

## 🚀 Uso Rápido

### 1. Iniciar Backend
```bash
cd zyrkom-ui
node backend/server.js
```
**Salida esperada:**
```
Zyrkom backend server running on http://localhost:8080
```

### 2. Iniciar Frontend 
```bash
# En otra terminal
cd zyrkom-ui
npm run dev
```
**Salida esperada:**
```
➜  Local:   http://localhost:5174/
```

### 3. Usar la UI
1. **Abrir:** http://localhost:5174/
2. **Doble-click** en el icono "Zyrkom ZK" del desktop
3. **Click** en "🎵 Generate Spanish Anthem ZK Proof"
4. **Escuchar** el himno en tiempo real
5. **Ver** las ondas de frecuencia en el canvas
6. **Descargar** los archivos .zkp y .json generados

## 🎵 Características

- **🎶 Audio Real:** Reproduce el Himno de España auténtico (Marcha Real)
- **📊 Visualización:** Ondas de frecuencia en tiempo real durante la reproducción
- **🔐 ZK Proofs:** Genera pruebas ZK reales usando Circle STARKs (StwoProver)
- **📄 Archivos:** Descarga .zkp (binario) y .json (metadata)
- **🖥️ Estilo:** Interfaz Windows 95 auténtica con desktop e iconos

## 🔧 Tecnologías

- **Frontend:** React + TypeScript + Vite + Windows 95 CSS
- **Backend:** Node.js + Express + WebSockets
- **ZK Engine:** Rust + Stwo (Circle STARKs) + Musical Physics
- **Audio:** Síntesis en tiempo real + Canvas visualization

## 🎯 Comando del Himno Directo

Si quieres ejecutar solo el test del himno sin UI:
```bash
cd ../zyrkom
cargo test --lib --features test-audio test_spanish_anthem_zk_real_melody -- --nocapture
```

## 🐛 Troubleshooting

- **Backend no conecta:** Verifica que `node backend/server.js` esté corriendo
- **WebSocket error:** Asegúrate que el puerto 8081 esté libre
- **Audio no suena:** Verifica que tienes dispositivos de audio funcionando
- **UI no carga:** Accede a http://localhost:5174/ (puerto puede cambiar)

## 🇪🇸 Himno de España

Esta UI ejecuta el **primer himno nacional en la historia** con validación Zero-Knowledge:
- **Tempo:** 76 BPM (oficial según Real Decreto 1560/1997)
- **Duración:** ~24 segundos 
- **Constraints:** 1,187+ ZK constraints matemáticos
- **Archivos:** Genera .zkp (63KB), .json (332KB), .zyrkom (1.2KB)

---

**🎵🔐 ¡Disfruta del primer himno nacional criptográficamente verificado del mundo! 🔐🎵**