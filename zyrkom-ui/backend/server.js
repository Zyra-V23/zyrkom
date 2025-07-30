const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const WebSocket = require('ws');

const app = express();
const PORT = 8080;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Zyrkom backend is running',
    timestamp: new Date().toISOString(),
    websocket_port: 8081
  });
});

// WebSocket server for real-time audio streaming
const wss = new WebSocket.Server({ port: 8081 });

// Store active connections
let activeConnections = new Set();

wss.on('connection', (ws) => {
  console.log('New WebSocket connection established');
  activeConnections.add(ws);
  
  ws.on('close', () => {
    activeConnections.delete(ws);
    console.log('WebSocket connection closed');
  });
});

// Function to generate realistic audio buffer from frequencies
function generateAudioBuffer(frequencies, amplitudes = null) {
  const sampleRate = 44100;
  const duration = 0.1; // 100ms chunks for smooth streaming
  const bufferSize = Math.floor(sampleRate * duration);
  const buffer = new Float32Array(bufferSize);
  
  if (!amplitudes) {
    amplitudes = frequencies.map(() => Math.random() * 0.5 + 0.3);
  }
  
  for (let i = 0; i < bufferSize; i++) {
    let sample = 0;
    
    // Combine all frequencies with their amplitudes
    frequencies.forEach((freq, index) => {
      const amplitude = amplitudes[index] || 0.3;
      const phase = (2 * Math.PI * freq * i) / sampleRate;
      sample += amplitude * Math.sin(phase);
    });
    
    // Normalize to prevent clipping
    buffer[i] = sample / frequencies.length;
  }
  
  return Array.from(buffer);
}

// Enhanced function to broadcast audio data with FFT analysis
function broadcastAudioData(audioData) {
  // If audioData is just frequencies array (legacy), convert it
  if (Array.isArray(audioData) && typeof audioData[0] === 'number') {
    audioData = {
      frequencies: audioData,
      amplitudes: audioData.map(() => Math.random() * 0.8 + 0.2),
      timestamp: Date.now()
    };
  }
  
  // Generate audio buffer if not provided
  if (!audioData.audioBuffer && audioData.frequencies) {
    audioData.audioBuffer = generateAudioBuffer(audioData.frequencies, audioData.amplitudes);
  }
  
  // Add FFT-like spectrum data for visualization
  if (audioData.frequencies) {
    const spectrumSize = 128;
    const spectrum = new Array(spectrumSize).fill(0);
    
    audioData.frequencies.forEach((freq, index) => {
      const binIndex = Math.floor((freq / 22050) * spectrumSize); // Map to spectrum bins
      if (binIndex < spectrumSize) {
        const amplitude = audioData.amplitudes ? audioData.amplitudes[index] : 0.5;
        spectrum[binIndex] = Math.max(spectrum[binIndex], amplitude * 255);
      }
    });
    
    audioData.spectrum = spectrum;
  }
  
  activeConnections.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'audio-data',
        data: audioData
      }));
    }
  });
}

// Endpoint to generate Spanish anthem with ZK proof
app.post('/generate-spanish-anthem', async (req, res) => {
  try {
    console.log('🇪🇸 Starting Spanish anthem ZK proof generation...');
    
    // Broadcast start message
    activeConnections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'status',
          message: '🎵 Iniciando generación del Himno de España con prueba ZK...'
        }));
      }
    });

    // Run the EXACT command from README.md
    const rustProcess = spawn('cargo', [
      'test',
      '--lib',
      '--features',
      'test-audio',
      'test_spanish_anthem_zk_real_melody',
      '--',
      '--nocapture'
    ], {
      cwd: path.join(__dirname, '../../zyrkom'),
      env: { ...process.env },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';
    let audioStarted = false;

    rustProcess.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      console.log(`🎼 Rust output: ${output}`);
      
      // Broadcast real-time output to frontend
      activeConnections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'output',
            data: output
          }));
        }
      });

      // Detect when audio starts playing
      if (output.includes('🎵 Playing') || output.includes('Playing interval') || output.includes('Playing chord')) {
        if (!audioStarted) {
          audioStarted = true;
          // Send audio start signal
          activeConnections.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'audio-start',
                message: '🎵 ¡Reproduciendo Himno de España!'
              }));
            }
          });
        }
        
        // Enhanced frequency and musical data parsing
        const frequencyMatch = output.match(/(\d+\.?\d*)\s*Hz/g);
        const noteMatch = output.match(/Playing\s+([A-G][#b]?\d?)/gi);
        const durationMatch = output.match(/Duration:\s*(\d+\.?\d*)\s*ms/gi);
        const amplitudeMatch = output.match(/Amplitude:\s*([\d.]+)/gi);
        
        if (frequencyMatch) {
          const frequencies = frequencyMatch.map(f => parseFloat(f.replace('Hz', '').trim()));
          const notes = noteMatch ? noteMatch.map(n => n.replace('Playing', '').trim()) : [];
          const durations = durationMatch ? durationMatch.map(d => parseFloat(d.replace('Duration:', '').replace('ms', '').trim())) : [];
          const amplitudes = amplitudeMatch ? amplitudeMatch.map(a => parseFloat(a.replace('Amplitude:', '').trim())) : 
                            frequencies.map(() => Math.random() * 0.6 + 0.3); // Realistic amplitudes
          
          // Broadcast rich audio data
          broadcastAudioData({
            frequencies,
            amplitudes,
            notes,
            durations,
            timestamp: Date.now(),
            isPlaying: true
          });
        }
        
        // Also parse interval data for harmonic visualization
        const intervalMatch = output.match(/interval.*?(\d+\.?\d*)\s*cents/gi);
        if (intervalMatch) {
          const cents = intervalMatch.map(i => parseFloat(i.match(/(\d+\.?\d*)\s*cents/)[1]));
          
          activeConnections.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'harmonic-data',
                data: { cents, timestamp: Date.now() }
              }));
            }
          });
        }
      }

      // Detect constraint generation
      if (output.includes('constraints') || output.includes('ZK')) {
        activeConnections.forEach(ws => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'zk-progress',
              data: output
            }));
          }
        });
      }
    });

    rustProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      console.error(`Rust stderr: ${data}`);
    });

    await new Promise((resolve, reject) => {
      rustProcess.on('close', (code) => {
        console.log(`🔚 Rust process finished with code: ${code}`);
        if (code !== 0) {
          reject(new Error(`Rust process exited with code ${code}: ${stderr}`));
        } else {
          resolve();
        }
      });
    });

    // Try to read the generated files
    const zkpPath = path.join(__dirname, '../../zyrkom/spanish_anthem_marcha_real.zkp');
    const jsonPath = path.join(__dirname, '../../zyrkom/spanish_anthem_marcha_real.json');
    const zyrkomPath = path.join(__dirname, '../../zyrkom/spanish_anthem_marcha_real.zyrkom');

    let zkpExists = false;
    let jsonData = null;
    let zyrkomContent = null;

    try {
      const zkpStats = await fs.stat(zkpPath);
      zkpExists = zkpStats.isFile();
    } catch (e) {
      console.log('ZKP file not found:', e.message);
    }

    try {
      const jsonContent = await fs.readFile(jsonPath, 'utf-8');
      jsonData = JSON.parse(jsonContent);
    } catch (e) {
      console.log('JSON file not found:', e.message);
    }

    try {
      zyrkomContent = await fs.readFile(zyrkomPath, 'utf-8');
    } catch (e) {
      console.log('Zyrkom file not found:', e.message);
    }

    // Broadcast completion
    activeConnections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'complete',
          message: '✅ ¡Himno de España generado con éxito!',
          files: {
            zkp: zkpExists,
            json: !!jsonData,
            zyrkom: !!zyrkomContent
          }
        }));
      }
    });

    res.json({
      success: true,
      json_data: jsonData,
      zyrkom_content: zyrkomContent,
      files_generated: {
        zkp: zkpExists,
        json: !!jsonData,
        zyrkom: !!zyrkomContent
      },
      output: stdout,
      message: '🇪🇸 Spanish anthem ZK proof generated successfully!'
    });

  } catch (error) {
    console.error('❌ Error generating Spanish anthem:', error);
    
    // Broadcast error
    activeConnections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'error',
          message: `❌ Error: ${error.message}`
        }));
      }
    });

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint to download the ZKP binary file
app.get('/download-zkp', async (req, res) => {
  try {
    const zkpPath = path.join(__dirname, '../../zyrkom/spanish_anthem_marcha_real.zkp');
    const zkpData = await fs.readFile(zkpPath);
    
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', 'attachment; filename="spanish_anthem_marcha_real.zkp"');
    res.send(zkpData);
  } catch (error) {
    console.error('Error downloading ZKP:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Zyrkom backend server running on http://localhost:${PORT}`);
});