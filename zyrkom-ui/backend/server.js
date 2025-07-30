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

console.log('🔗 WebSocket server running on ws://localhost:8081');

// Store active connections
let activeConnections = new Set();

wss.on('connection', (ws) => {
  console.log('✅ New WebSocket connection established');
  activeConnections.add(ws);
  
  ws.on('close', () => {
    activeConnections.delete(ws);
    console.log('❌ WebSocket connection closed');
  });
  
  ws.on('error', (error) => {
    console.error('🚨 WebSocket error:', error);
    activeConnections.delete(ws);
  });
});

wss.on('error', (error) => {
  console.error('🚨 WebSocket Server error:', error);
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
  
  // Generate realistic FFT-like spectrum data from frequencies
  if (audioData.frequencies && audioData.frequencies.length > 0) {
    const spectrumSize = 128;
    const spectrum = new Array(spectrumSize).fill(0);
    const maxFreq = 22050; // Nyquist frequency
    
    // Map real frequencies to spectrum bins with proper scaling
    audioData.frequencies.forEach((freq, index) => {
      const amplitude = audioData.amplitudes ? audioData.amplitudes[index] : 0.4;
      
      // Primary frequency bin
      const binIndex = Math.floor((freq / maxFreq) * spectrumSize);
      if (binIndex >= 0 && binIndex < spectrumSize) {
        spectrum[binIndex] = Math.max(spectrum[binIndex], amplitude * 255);
      }
      
      // Add harmonic overtones for realism (2nd and 3rd harmonics)
      const harmonic2 = freq * 2;
      const harmonic3 = freq * 3;
      
      if (harmonic2 < maxFreq) {
        const harmonic2Bin = Math.floor((harmonic2 / maxFreq) * spectrumSize);
        if (harmonic2Bin < spectrumSize) {
          spectrum[harmonic2Bin] = Math.max(spectrum[harmonic2Bin], amplitude * 0.3 * 255);
        }
      }
      
      if (harmonic3 < maxFreq) {
        const harmonic3Bin = Math.floor((harmonic3 / maxFreq) * spectrumSize);
        if (harmonic3Bin < spectrumSize) {
          spectrum[harmonic3Bin] = Math.max(spectrum[harmonic3Bin], amplitude * 0.15 * 255);
        }
      }
      
      // Add subtle frequency spreading for natural look
      for (let spread = -2; spread <= 2; spread++) {
        const spreadBin = binIndex + spread;
        if (spreadBin >= 0 && spreadBin < spectrumSize && spread !== 0) {
          const spreadAmp = amplitude * Math.exp(-Math.abs(spread) * 0.5) * 0.2;
          spectrum[spreadBin] = Math.max(spectrum[spreadBin], spreadAmp * 255);
        }
      }
    });
    
    // Add subtle noise floor for realism
    for (let i = 0; i < spectrumSize; i++) {
      if (spectrum[i] === 0) {
        spectrum[i] = Math.random() * 5; // Very low noise floor
      }
    }
    
    audioData.spectrum = spectrum;
  } else {
    // Generate subtle idle spectrum when no frequencies
    const spectrumSize = 128;
    const spectrum = new Array(spectrumSize);
    for (let i = 0; i < spectrumSize; i++) {
      spectrum[i] = Math.random() * 8 + Math.sin(Date.now() * 0.001 + i * 0.1) * 3;
    }
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

// Add endpoint for Musical DNA generation
app.post('/generate-musical-dna', async (req, res) => {
  try {
    const { name, favorite_songs, selected_genres } = req.body;
    
    console.log(`🧬 Generating Musical DNA for: ${name}`);
    console.log(`🎵 Songs: ${favorite_songs?.join(', ')}`);
    console.log(`🎸 Genres: ${selected_genres?.join(', ')}`);

    // Call the Rust musical-dna binary
    const rustProcess = spawn('cargo', [
      'run',
      '--bin',
      'musical-dna',
      'generate',
      '--name',
      name
    ], {
      cwd: path.join(__dirname, '../../zyrkom'),
      env: { ...process.env },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';

    rustProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    rustProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    rustProcess.on('close', async (code) => {
      if (code !== 0) {
        console.error('❌ Musical DNA generation failed:', errorOutput);
        return res.status(500).json({ error: 'Musical DNA generation failed' });
      }

      try {
        // Parse the output to extract Musical DNA data
        const fingerprintMatch = output.match(/Musical DNA: (MDNA-[a-f0-9]+)/);
        const colorMatch = output.match(/Synesthetic Color: (#[a-f0-9]{6})/);
        const complexityMatch = output.match(/Harmonic Complexity: (\d+)%/);

        if (!fingerprintMatch || !colorMatch || !complexityMatch) {
          throw new Error('Failed to parse Musical DNA output');
        }

        // Try to read the generated JSON file
        const filename = `musical_dna_${name.toLowerCase().replace(/\s+/g, '_')}.json`;
        const filepath = path.join(__dirname, '../../zyrkom', filename);
        
        let dnaData = {
          fingerprint: fingerprintMatch[1],
          synesthetic_color: colorMatch[1],
          harmonic_complexity: parseInt(complexityMatch[1]),
          interval_preferences: [],
          rhythm_signature: [],
          tonal_centers: []
        };

        try {
          const fileContent = await fs.readFile(filepath, 'utf8');
          const parsedData = JSON.parse(fileContent);
          dnaData = { ...dnaData, ...parsedData };
        } catch (fileErr) {
          console.warn('⚠️ Could not read DNA JSON file, using parsed data');
        }

        console.log('✅ Musical DNA generated successfully:', dnaData.fingerprint);
        res.json({
          success: true,
          dna_data: dnaData,
          raw_output: output
        });

      } catch (parseErr) {
        console.error('❌ Error parsing Musical DNA output:', parseErr);
        res.status(500).json({ error: 'Failed to parse Musical DNA data' });
      }
    });

  } catch (error) {
    console.error('❌ Musical DNA generation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Zyrkom backend server running on http://localhost:${PORT}`);
  console.log(`🔗 WebSocket server ready on ws://localhost:8081`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🎵 Ready for Spanish Anthem ZK proof generation!`);
  console.log(`🧬 Ready for Musical DNA generation!`);
});