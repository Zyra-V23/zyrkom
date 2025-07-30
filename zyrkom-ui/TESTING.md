# 🧪 Testing Zyrkom UI

## Pasos para Probar la Aplicación

### 1. Backend Running ✅
El backend debe estar corriendo en otra terminal:
```bash
cd zyrkom-ui
node backend/server.js
```
**Output esperado:** `Zyrkom backend server running on http://localhost:8080`

### 2. Frontend Running ✅  
```bash
cd zyrkom-ui
npm run dev
```
**Output esperado:** `Local: http://localhost:5174/`

### 3. Probar la UI
1. **Abrir** http://localhost:5174/
2. **Ver** desktop con background Windows 95
3. **Ver iconos:** DOOM (arriba izquierda) y "Zyrkom ZK" (abajo izquierda)
4. **Verificar taskbar:** Start button con el icono personalizado

### 4. Probar Zyrkom App
1. **Doble-click** en icono "Zyrkom ZK"
2. **Debería abrirse** ventana flotante con:
   - Título: "Zyrkom - Zero-Knowledge Musical Physics"
   - Subtítulo: "Powered by **StwoProver** (Circle STARKs)"
   - Canvas negro con grid verde
   - Botón: "🎵 Generate Spanish Anthem ZK Proof"
   - Status: "Listo para generar Himno de España"

### 5. Generar Himno
1. **Click** en "🎵 Generate Spanish Anthem ZK Proof"
2. **Ver** barra de progreso
3. **Esperar** ~25 segundos (tiempo del himno + ZK generation)
4. **Ver** JSON results al final
5. **Descargar** archivos .zkp y .json

## 🐛 Troubleshooting

### Ventana no se abre / Pantalla en blanco
- **Causa:** Error JavaScript en componente
- **Solución:** Check browser console (F12) para errores

### "NetworkError" en la UI
- **Causa:** Backend no está corriendo
- **Solución:** Ejecutar `node backend/server.js`

### Backend no genera archivos
- **Causa:** Zyrkom Rust no está compilado
- **Solución:** 
  ```bash
  cd ../zyrkom
  cargo build --release --features test-audio
  ```

## ✅ Estado Actual

- ✅ UI Windows 95 funcionando
- ✅ Iconos personalizados 
- ✅ Ventana ZyrkomWindow se abre sin crashes
- ✅ Canvas con grid por defecto
- ✅ Botón de generación funcional
- ✅ Backend conectado
- ⏳ Testing completo de generación ZK en progreso

## 🎯 Próximos Pasos

1. **Verificar** que la ventana se abre correctamente
2. **Testear** generación completa con backend
3. **Conectar** WebSocket para output en tiempo real
4. **Agregar** visualización de audio real