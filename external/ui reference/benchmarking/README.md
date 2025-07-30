# 🎮 RETRO BENCH - Aplicación de Benchmarking con Estilo Retro

Una aplicación web moderna de benchmarking de rendimiento gráfico con una interfaz nostálgica inspirada en los sistemas de los años 80-90.

## 🚀 Características Principales

### 🎯 Funcionalidades Core
- **Benchmarking 3D en Tiempo Real**: Utiliza Three.js y WebGL para pruebas de rendimiento gráfico
- **Múltiples Niveles de Estrés**: STANDARD, EXTREME y STABILITY para diferentes tipos de pruebas
- **Análisis de Juegos**: Catálogo de juegos modernos con requisitos de sistema
- **Reportes Detallados**: Análisis completo de rendimiento con gráficos y métricas
- **Configuración Avanzada**: Personalización de duración y nivel de estrés de las pruebas
- **🔥 DOOM WebAssembly**: Juega DOOM clásico directamente en el navegador

### 🎨 Interfaz Retro
- **Estilo Terminal CRT**: Efecto de monitor de tubo catódico auténtico
- **Tipografía Pixel Perfect**: Fuente "Press Start 2P" para máxima nostalgia
- **Colores Clásicos**: Esquema verde fosforescente sobre fondo oscuro
- **Animaciones de Texto**: Efecto de escritura en tiempo real
- **Audio Retro**: Efectos de sonido nostálgicos para interacciones

## 🏗️ Arquitectura Técnica

### Stack Tecnológico
- **Frontend**: React 18 + TypeScript
- **Bundler**: Vite
- **Styling**: Tailwind CSS
- **3D Graphics**: Three.js
- **Routing**: React Router DOM
- **Charts**: Chart.js + React-ChartJS-2
- **Audio**: Howler.js
- **Icons**: Lucide React

### Estructura del Proyecto
```
src/
├── components/          # Componentes UI reutilizables
│   ├── RetroButton.tsx     # Botón con estilo retro
│   ├── RetroMenu.tsx       # Menú de navegación
│   ├── RetroWindow.tsx     # Ventana con marco retro
│   ├── RetroProgress.tsx   # Barra de progreso
│   └── RetroList.tsx       # Lista con estilo retro
├── screens/             # Pantallas principales
│   ├── MainScreen.tsx      # Pantalla principal con terminal
│   ├── BenchmarkScreen.tsx # Ejecución de benchmarks
│   ├── CatalogScreen.tsx   # Catálogo de juegos
│   ├── ReportsScreen.tsx   # Reportes y análisis
│   └── SettingsScreen.tsx  # Configuración del sistema
├── contexts/            # Gestión de estado global
│   ├── SoundContext.tsx    # Manejo de audio
│   └── RetroContext.tsx    # Estado general de la app
├── hooks/               # Custom React hooks
│   ├── useBenchmark.ts     # Lógica de benchmarking
│   └── useSystemInfo.ts    # Información del sistema
├── utils/               # Utilidades y helpers
│   ├── benchmark.ts        # Motor de benchmarking 3D
│   └── audioVisualizer.ts  # Visualizador de audio
└── data/                # Datos mock y configuración
    └── mockData.ts         # Datos de juegos y hardware
```

## 🎮 Funcionalidades por Pantalla

### 1. Pantalla Principal (MainScreen)
- **Terminal Interactivo**: Comandos como BENCH, CATALOG, REPORTS, SETTINGS
- **Menú Visual**: Navegación con botones estilo retro
- **Animación de Arranque**: Secuencia de inicialización del sistema
- **Comandos Disponibles**:
  - `HELP` - Mostrar ayuda
  - `BENCH` - Ir a benchmarks
  - `CATALOG` - Ver catálogo de juegos
  - `REPORTS` - Ver reportes
  - `SETTINGS` - Configuración
  - `CLEAR` - Limpiar pantalla

### 2. Pantalla de Benchmark (BenchmarkScreen)
- **Selección de Juego**: Catálogo de juegos modernos para benchmarking
- **Configuración de Prueba**:
  - Duración: 30s, 1min, 2min, 5min
  - Nivel de estrés: STANDARD, EXTREME, STABILITY
- **Ejecución en Tiempo Real**: Visualización 3D durante la prueba
- **Métricas en Vivo**: FPS, uso de GPU/CPU, temperatura
- **Resultados Detallados**: Score final y clasificación de GPU

### 3. Catálogo de Juegos (CatalogScreen)
- **Lista de Juegos**: Títulos modernos con requisitos de sistema
- **Información Detallada**: Plataforma, tamaño, año, requisitos mínimos/recomendados
- **Filtros**: Por plataforma, año, requisitos
- **Comparación**: Requisitos vs. sistema actual

### 4. Reportes (ReportsScreen)
- **Gráficos de Rendimiento**: Visualización con Chart.js
- **Análisis de Tendencias**: Histórico de benchmarks
- **Comparación de Hardware**: Rendimiento relativo
- **Recomendaciones**: Sugerencias de mejora del sistema

### 5. Configuración (SettingsScreen)
- **Información del Sistema**: Hardware detectado
- **Configuración de Audio**: Volumen y efectos
- **Preferencias Visuales**: Efectos CRT, animaciones
- **Configuración de Benchmark**: Parámetros por defecto

## 🔧 Motor de Benchmarking

### Tecnología WebGL/Three.js
- **Renderizado 3D**: Escenas complejas con múltiples objetos
- **Iluminación Dinámica**: Múltiples fuentes de luz
- **Animaciones**: Rotaciones y transformaciones en tiempo real
- **Escalabilidad**: Ajuste automático de complejidad según el nivel de estrés

### Métricas de Rendimiento
- **FPS (Frames Per Second)**: Fluidez de renderizado
- **Score Compuesto**: Basado en FPS, complejidad y duración
- **Clasificación GPU**: LOW, MEDIUM, HIGH, ULTRA
- **Detección WebGPU**: Soporte para tecnologías modernas

### Niveles de Estrés
- **STANDARD**: Prueba equilibrada (1000 objetos)
- **EXTREME**: Máximo estrés (2500 objetos + animaciones complejas)
- **STABILITY**: Prueba de estabilidad prolongada (1500 objetos)

## 🎵 Sistema de Audio

### Efectos de Sonido
- **Menu Select**: Navegación entre opciones
- **Typing**: Efecto de escritura en terminal
- **Success**: Completación exitosa de tareas
- **Error**: Notificación de errores

### Tecnología Howler.js
- **Audio Espacial**: Soporte para efectos 3D
- **Múltiples Formatos**: MP3, WAV, OGG
- **Control de Volumen**: Configuración independiente por efecto

## 🚀 Instalación y Uso

### Requisitos Previos
- Node.js 18+ 
- npm o yarn
- Navegador moderno con soporte WebGL

### Instalación
```bash
# Clonar el repositorio
git clone <repository-url>
cd benchmarking

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Construir para producción
npm run build
```

### Scripts Disponibles
- `npm run dev` - Servidor de desarrollo
- `npm run build` - Construcción para producción
- `npm run lint` - Análisis de código
- `npm run preview` - Vista previa de la build

## 🎨 Personalización

### Temas y Colores
Los colores principales están definidos en `src/index.css`:
- Verde fosforescente: `#00ff00`
- Azul oscuro: `#000040`
- Efectos CRT y scanlines personalizables

### Datos de Juegos
Los juegos y hardware se pueden modificar en `src/data/mockData.ts`:
- Agregar nuevos títulos
- Actualizar requisitos de sistema
- Modificar presets gráficos

## 🔮 Tecnologías Futuras

### WebGPU Support
- Detección automática de WebGPU
- Fallback a WebGL para compatibilidad
- Preparado para APIs gráficas de próxima generación

### Extensibilidad
- Arquitectura modular para nuevos tipos de benchmark
- Sistema de plugins para métricas personalizadas
- API para integración con herramientas externas

## 📊 Métricas y Analytics

### Datos Recopilados
- Rendimiento de hardware
- Patrones de uso
- Preferencias de configuración
- Resultados de benchmark históricos

### Análisis de Rendimiento
- Detección de cuellos de botella
- Recomendaciones de hardware
- Comparación con sistemas similares
- Tendencias de rendimiento temporal

## 🎮 DOOM WebAssembly Integration

### 🔧 Compilación Exitosa
Hemos resuelto exitosamente los problemas de compilación de DOOM para WebAssembly:

#### Problema Original
- **Error**: `SDL_mixer.h file not found` durante la compilación con Emscripten
- **Causa**: Configuración incorrecta de SDL_mixer y problemas con flags de compilación

#### Solución Implementada
```bash
# Flags de compilación corregidos
CFLAGS="-DFEATURE_SOUND -sUSE_SDL=2 -sUSE_SDL_MIXER=2"

# Linking con optimizaciones de memoria
emcc $CFLAGS --preload-file doom1.wad -sUSE_SDL=2 -sUSE_SDL_MIXER=2 \
     -sALLOW_MEMORY_GROWTH=1 -sINITIAL_MEMORY=67108864 build/*.o -o doomgeneric.html
```

#### Archivos Generados
- ✅ `doomgeneric.html` - Interfaz principal para ejecutar DOOM
- ✅ `doomgeneric.js` - Runtime JavaScript de WebAssembly  
- ✅ `doomgeneric.wasm` - Binario WebAssembly compilado
- ✅ `doomgeneric.data` - Datos del juego (incluye doom1.wad)

### 🎯 Características de DOOM
- **Audio Completo**: Soporte para música y efectos de sonido via SDL_mixer
- **Controles Web**: Adaptado para navegadores modernos
- **Rendimiento Optimizado**: Configuración de memoria para WebAssembly
- **Compatibilidad**: Funciona en todos los navegadores con soporte WebAssembly

### 🚀 Integración en la App
DOOM está completamente integrado en nuestra aplicación retro:
- Accesible desde el menú principal con el botón "DOOM"
- Interfaz consistente con el tema retro de la aplicación
- Transiciones suaves entre la app y el juego
- Mantenimiento del contexto de audio y configuración

## 🤝 Contribución

### Estructura de Commits
- `feat:` - Nueva funcionalidad
- `fix:` - Corrección de bugs
- `style:` - Cambios de estilo/formato
- `refactor:` - Refactorización de código
- `test:` - Pruebas
- `docs:` - Documentación

### Áreas de Mejora
- Nuevos tipos de benchmark (CPU, memoria, almacenamiento)
- Soporte para más APIs gráficas
- Integración con bases de datos de hardware
- Modo multijugador para comparaciones

## 📝 Licencia

Este proyecto está bajo licencia MIT. Ver `LICENSE` para más detalles.

---

**RETRO BENCH V1.0.0 (C)2025 - PRESS F1 FOR HELP** 🎮 