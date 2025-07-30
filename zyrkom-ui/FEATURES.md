# 🎵 Zyrkom UI - Advanced Features

## 🎨 Real-Time Audio Visualization

### AudioVisualizer Component

Modern, smooth audio visualization with three interactive modes:

#### 📊 **Visualization Modes**

1. **🌊 Waveform Mode**
   - Real-time audio buffer visualization
   - Gradient colors (green → blue → purple)
   - Glow effects for enhanced aesthetics
   - Smooth 60fps animations

2. **📈 Spectrum Mode** 
   - FFT-like frequency spectrum display
   - Color-coded by frequency range (blue → red)
   - Magnitude-based saturation/lightness
   - Glow effects for prominent frequencies

3. **📊 Frequency Bars Mode**
   - Individual frequency bars with amplitudes
   - Color-coded by frequency (green → cyan)
   - Real-time frequency labels
   - Note name overlays

#### 🔗 **WebSocket Real-Time Streaming**

Based on modern 2025 techniques from [Real-Time Audio Streaming in React.js](https://medium.com/@sandeeplakhiwal/real-time-audio-streaming-in-react-js-handling-and-playing-live-audio-buffers-c72ec38c91fa):

- **Buffer Queuing**: Audio data queued and processed smoothly
- **Auto-Reconnect**: Automatic WebSocket reconnection on disconnect
- **Smooth Interpolation**: 60fps smooth transitions between data points
- **Connection Status**: Real-time connection indicator (🟢/🟡/🔴)

#### 🎼 **Musical Data Support**

Enhanced parsing of Rust output for rich musical visualization:

```typescript
interface AudioData {
  frequencies: number[];      // Hz values
  amplitudes: number[];       // 0.0-1.0 amplitude
  notes?: string[];          // Musical notes (C4, G4, etc.)
  durations?: number[];      // Note durations in ms
  audioBuffer?: number[];    // Raw audio samples
  spectrum?: number[];       // FFT spectrum data (128 bins)
  timestamp: number;         // Unix timestamp
  isPlaying?: boolean;       // Playback status
}
```

#### 🎛️ **Interactive Features**

- **Click-to-Switch**: Click on visualization to change modes
- **HUD Controls**: Visual mode selector with icons
- **Real-time Status**: Connection status, frequency count, timestamps
- **Harmonic Display**: Show interval data in cents
- **Note Overlays**: Musical note names with frequencies

### 🛠️ **Technical Implementation**

#### Backend Enhancements (server.js)
```javascript
// Realistic audio buffer generation
function generateAudioBuffer(frequencies, amplitudes) {
  const sampleRate = 44100;
  const duration = 0.1; // 100ms chunks
  // ... sine wave synthesis for each frequency
}

// Enhanced frequency parsing
const frequencyMatch = output.match(/(\d+\.?\d*)\s*Hz/g);
const noteMatch = output.match(/Playing\s+([A-G][#b]?\d?)/gi);
const amplitudeMatch = output.match(/Amplitude:\s*([\d.]+)/gi);
```

#### Frontend Canvas Optimization
```typescript
// Smooth interpolation for 60fps
const interpolate = (current: number[], target: number[], factor: number = 0.1) => {
  return current.map((val, i) => val + (target[i] - val) * factor);
};

// Efficient drawing with requestAnimationFrame
const draw = useCallback(() => {
  // Update smooth data
  setSmoothSpectrum(prev => interpolate(prev, audioData.spectrum!, 0.15));
  // Draw visualization
  animationRef.current = requestAnimationFrame(draw);
}, [audioData, isPlaying, visualMode]);
```

## 🔧 **Usage**

### Starting the Enhanced UI

1. **Backend with WebSocket**:
   ```bash
   cd zyrkom-ui
   node backend/server.js
   ```
   → Starts on `localhost:8080` + WebSocket on `8081`

2. **Frontend with Visualizer**:
   ```bash
   npm run dev
   ```
   → UI on `localhost:5174`

3. **Generate Spanish Anthem**:
   - Click "🎵 Generate Spanish Anthem ZK Proof" 
   - Watch real-time audio visualization
   - Switch between visualization modes
   - Download `.zkp` and `.json` files

### 🎯 **Real-Time Features in Action**

1. **Audio Streaming**: Backend captures Rust audio output and streams frequency data
2. **Visual Feedback**: Canvas shows real-time waveform/spectrum/bars
3. **Musical Notes**: Note names (FA, DO, LA, etc.) displayed during playback  
4. **Harmonic Analysis**: Interval data in cents for musical physics validation
5. **ZK Progress**: Real-time progress updates during STARK proof generation

## 🚀 **Modern Web Technologies Used**

- **WebSocket API**: Real-time bidirectional communication
- **Canvas 2D**: Hardware-accelerated graphics rendering  
- **WebAudio Concepts**: FFT-like spectrum analysis simulation
- **TypeScript**: Type-safe audio data structures
- **React Hooks**: Efficient state management and lifecycle
- **requestAnimationFrame**: Smooth 60fps animations

## 🎨 **Visual Design**

- **Windows 95 Aesthetic**: Retro UI maintaining pixel-perfect style
- **Modern Gradients**: Contemporary color schemes within retro framework
- **Glow Effects**: Canvas shadow effects for audio prominence
- **Interactive HUD**: Mode switching with visual feedback
- **Status Indicators**: Real-time connection and data status

This implementation represents state-of-the-art real-time audio visualization for 2025, combining modern web technologies with the nostalgic Windows 95 aesthetic while maintaining the technical rigor of a Zero-Knowledge musical physics framework.