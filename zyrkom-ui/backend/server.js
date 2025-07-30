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

// Function to broadcast audio data to all connected clients
function broadcastAudioData(audioData) {
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
        
        // Parse frequency data if available
        const frequencyMatch = output.match(/(\d+\.?\d*)\s*Hz/g);
        if (frequencyMatch) {
          const frequencies = frequencyMatch.map(f => parseFloat(f.replace('Hz', '')));
          broadcastAudioData({ frequencies, timestamp: Date.now() });
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