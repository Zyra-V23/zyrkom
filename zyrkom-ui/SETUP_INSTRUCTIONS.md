# 🎵🔐 Zyrkom Matrix UI - Setup Instructions

## 🚀 Complete Setup Guide for Matrix-Style Frontend

### **Prerequisites**

**Required Tools:**
- **Node.js** 18+ with npm 9+
- **Rust** 1.70+ with Cargo
- **Tauri CLI** for desktop app compilation
- **Git** for version control

**Operating System Support:**
- ✅ Windows 10/11
- ✅ macOS 10.15+
- ✅ Linux (Ubuntu 20.04+, Fedora 35+)

---

## 📦 **Installation Steps**

### **Step 1: Install Prerequisites**

```bash
# Install Node.js (if not already installed)
# Visit: https://nodejs.org/

# Install Rust (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Install Tauri CLI
cargo install tauri-cli
```

### **Step 2: Navigate to UI Directory**

```bash
cd zyrkom-ui
```

### **Step 3: Install Frontend Dependencies**

```bash
# Install all npm dependencies
npm install

# Or using yarn
yarn install
```

### **Step 4: Install Additional Development Tools**

```bash
# TypeScript compiler (if needed)
npm install -g typescript

# ESLint for code quality
npm install --save-dev @typescript-eslint/eslint-plugin @typescript-eslint/parser
```

---

## 🛠️ **Development Setup**

### **Environment Configuration**

Create `.env` file in `zyrkom-ui/`:
```env
# Development settings
VITE_APP_TITLE=Zyrkom Matrix UI
VITE_APP_VERSION=0.1.0
VITE_API_URL=http://localhost:3000

# Tauri settings
TAURI_DEBUG=true
RUST_LOG=debug
```

### **Additional Dependencies (if missing)**

```bash
# Core React dependencies
npm install react@^18.2.0 react-dom@^18.2.0

# Tauri integration
npm install @tauri-apps/api@^1.6.0

# UI and visualization
npm install three@^0.160.0 @react-three/fiber@^8.15.0 @react-three/drei@^9.92.0
npm install framer-motion@^10.16.0 lucide-react@^0.303.0
npm install clsx@^2.0.0 react-hot-toast@^2.4.1

# Development dependencies
npm install --save-dev @types/react@^18.2.43 @types/react-dom@^18.2.17
npm install --save-dev @types/three@^0.160.0
npm install --save-dev @vitejs/plugin-react@^4.2.1
npm install --save-dev vite@^5.0.8 typescript@^5.2.2
npm install --save-dev tailwindcss@^3.3.6 autoprefixer@^10.4.16 postcss@^8.4.32
```

---

## 🎮 **Running the Application**

### **Development Mode (Recommended)**

```bash
# Start both frontend and Tauri backend in development mode
npm run tauri:dev

# This will:
# 1. Start Vite dev server on localhost:3000
# 2. Compile and run Tauri app with hot reload
# 3. Open Matrix UI window automatically
```

### **Frontend Only (for UI development)**

```bash
# Start only the frontend (for styling/UI work)
npm run dev

# Visit http://localhost:3000 in browser
# Note: Tauri API calls will fail in browser
```

### **Production Build**

```bash
# Build optimized production app
npm run tauri:build

# Outputs:
# - Windows: zyrkom-matrix-ui.exe
# - macOS: Zyrkom Matrix UI.app  
# - Linux: zyrkom-matrix-ui.AppImage
```

---

## 🎵 **Features & Usage**

### **Core Functionality**

**Musical Interval Generation:**
- Perfect Fifth (3:2 ratio)
- Major Third (5:4 ratio)  
- Octave (2:1 ratio)
- Custom frequency input

**Zero-Knowledge Proofs:**
- Generate ZK proofs for musical constraints
- Real-time proof verification
- Performance metrics display

**Audio Visualization:**
- Real-time frequency analysis
- Matrix-style waveform display
- Audio playback with visual feedback

**Interactive Terminal:**
- Command-line interface for ZK operations
- Test suite execution
- System status monitoring

### **Matrix UI Elements**

**Visual Effects:**
- Matrix rain background animation
- Green phosphor-style terminal
- Glowing buttons and panels
- Scanline effects and flicker
- Musical/crypto symbols falling

**Audio Integration:**
- Real-time audio synthesis
- Frequency visualization
- Constraint validation through sound
- Multi-channel audio support

---

## 🛠️ **Development Workflow**

### **File Structure**
```
zyrkom-ui/
├── src/
│   ├── main.tsx              # React entry point
│   ├── App.tsx               # Main application component
│   ├── matrix-global.css     # Matrix styling
│   └── components/
│       ├── MatrixRain.tsx    # Background effect
│       ├── FrequencyVisualizer.tsx  # Audio visualization
│       ├── ZKTerminal.tsx    # Terminal interface
│       └── IntervalControls.tsx     # Musical controls
├── src-tauri/               # (Created by tauri init)
│   ├── src/main.rs         # Tauri backend (our implementation)
│   ├── Cargo.toml          # Rust dependencies
│   └── tauri.conf.json     # Tauri configuration
├── package.json            # Node dependencies
├── vite.config.ts          # Vite configuration
└── tsconfig.json           # TypeScript configuration
```

### **Development Commands**

```bash
# Development with hot reload
npm run tauri:dev

# Type checking
npm run type-check

# Linting
npm run lint

# Build for production
npm run tauri:build

# Frontend preview (production build)
npm run preview
```

---

## 🔧 **Troubleshooting**

### **Common Issues**

**1. Tauri CLI not found:**
```bash
# Reinstall Tauri CLI
cargo install tauri-cli --force
```

**2. Node modules issues:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**3. Rust compilation errors:**
```bash
# Update Rust toolchain
rustup update stable
```

**4. Audio not working:**
```bash
# Linux: Install ALSA development libraries
sudo apt-get install libasound2-dev

# macOS: Ensure microphone permissions granted
# Windows: Ensure audio drivers installed
```

**5. Fonts not loading:**
```bash
# Check internet connection for Google Fonts
# Or download Fira Code locally
```

### **Performance Optimization**

**For Development:**
- Use `npm run dev` for UI-only development
- Enable Rust debug mode for backend issues
- Monitor browser dev tools for frontend performance

**For Production:**
- Use `--release` flag for optimized builds
- Enable LTO (Link Time Optimization) in Cargo.toml
- Minimize audio buffer sizes for real-time response

---

## 🚀 **Advanced Configuration**

### **Tauri Configuration**

Edit `tauri.conf.json` for:
- Window size and behavior
- Security permissions
- System tray integration
- Auto-updater settings

### **Audio Configuration**

For optimal audio performance:
```rust
// In main.rs, adjust audio settings
const SAMPLE_RATE: u32 = 44100;
const BUFFER_SIZE: u32 = 256;  // Lower = less latency
const CHANNELS: u16 = 2;       // Stereo output
```

### **Matrix Effects Customization**

Modify `matrix-global.css`:
```css
:root {
  --matrix-rain-speed: 15s;    /* Faster rain */
  --matrix-glow-intensity: 0.8; /* Brighter glow */
  --matrix-primary: #00ff41;     /* Slightly different green */
}
```

---

## 🎯 **Next Steps**

After successful setup:

1. **Test Core Functionality:**
   - Generate perfect fifth interval
   - Create ZK proof
   - Play audio and verify visualization

2. **Explore Advanced Features:**
   - Custom frequency inputs
   - Terminal commands
   - Audio effect customization

3. **Development:**
   - Modify Matrix styling
   - Add new musical intervals
   - Extend visualization capabilities

4. **Distribution:**
   - Build production app
   - Test on target platforms
   - Package for distribution

---

**🎵🔐 Ready to Experience Musical Cryptography in Matrix Style! 🔐🎵**

The Zyrkom Matrix UI provides an unprecedented interface for musical zero-knowledge cryptography. Enjoy exploring the intersection of music, mathematics, and cutting-edge cryptography! 