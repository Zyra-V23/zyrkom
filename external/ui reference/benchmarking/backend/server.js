import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { spawn, exec } from 'child_process';
import { createServer } from 'http';
import path from 'path';
import fs from 'fs';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(cors());
app.use(express.json());

// Store active processes
const activeProcesses = new Map();
let torProcess = null;
let torStatus = { running: false, pid: null, onionAddress: null };
let mullvadStatus = { connected: false, location: null, ip: null };

// WebSocket connections for real-time updates
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  
  // Send current status immediately
  ws.send(JSON.stringify({
    type: 'status_update',
    tor: torStatus,
    mullvad: mullvadStatus
  }));

  ws.on('close', () => {
    clients.delete(ws);
  });
});

// Broadcast status updates to all connected clients
function broadcastStatus() {
  const message = JSON.stringify({
    type: 'status_update',
    tor: torStatus,
    mullvad: mullvadStatus
  });
  
  clients.forEach(client => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(message);
    }
  });
}

// Utility function to execute commands with promise
function execCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject({ error: error.message, stderr });
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

// TOR MANAGEMENT ENDPOINTS

app.post('/api/tor/start', async (req, res) => {
  try {
    if (torProcess && !torProcess.killed) {
      return res.json({ success: false, message: 'Tor is already running' });
    }

    // Check if Tor is installed
    try {
      await execCommand('tor --version');
    } catch (error) {
      return res.json({ 
        success: false, 
        message: 'Tor not found. Please install Tor first.',
        error: error.error 
      });
    }

    // Create torrc configuration
    const torrcPath = path.join(process.cwd(), 'torrc');
    const torrcContent = `
# Tor configuration for hidden service
SocksPort 9050
ControlPort 9051
HiddenServiceDir ${path.join(process.cwd(), 'hidden_service')}
HiddenServicePort 80 127.0.0.1:3000
Log notice stdout
`;

    fs.writeFileSync(torrcPath, torrcContent);

    // Start Tor process
    torProcess = spawn('tor', ['-f', torrcPath], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    torStatus.running = true;
    torStatus.pid = torProcess.pid;

    // Handle Tor output
    torProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('Tor stdout:', output);
      
      // Look for onion address
      if (output.includes('Bootstrapped 100%')) {
        // Read onion address from hostname file
        const hostnameFile = path.join(process.cwd(), 'hidden_service', 'hostname');
        if (fs.existsSync(hostnameFile)) {
          torStatus.onionAddress = fs.readFileSync(hostnameFile, 'utf8').trim();
          broadcastStatus();
        }
      }
    });

    torProcess.stderr.on('data', (data) => {
      console.log('Tor stderr:', data.toString());
    });

    torProcess.on('close', (code) => {
      console.log(`Tor process exited with code ${code}`);
      torStatus.running = false;
      torStatus.pid = null;
      torProcess = null;
      broadcastStatus();
    });

    broadcastStatus();
    res.json({ success: true, message: 'Tor started successfully', pid: torProcess.pid });

  } catch (error) {
    res.json({ success: false, message: 'Failed to start Tor', error: error.message });
  }
});

app.post('/api/tor/stop', async (req, res) => {
  try {
    if (torProcess && !torProcess.killed) {
      torProcess.kill('SIGTERM');
      torStatus.running = false;
      torStatus.pid = null;
      torStatus.onionAddress = null;
      torProcess = null;
      broadcastStatus();
      res.json({ success: true, message: 'Tor stopped successfully' });
    } else {
      res.json({ success: false, message: 'Tor is not running' });
    }
  } catch (error) {
    res.json({ success: false, message: 'Failed to stop Tor', error: error.message });
  }
});

app.get('/api/tor/status', (req, res) => {
  res.json({ success: true, status: torStatus });
});

// MULLVAD MANAGEMENT ENDPOINTS

app.post('/api/mullvad/connect', async (req, res) => {
  try {
    const result = await execCommand('mullvad connect');
    await updateMullvadStatus();
    res.json({ success: true, message: 'Mullvad connect command executed', output: result.stdout });
  } catch (error) {
    res.json({ success: false, message: 'Failed to connect Mullvad', error: error.error });
  }
});

app.post('/api/mullvad/disconnect', async (req, res) => {
  try {
    const result = await execCommand('mullvad disconnect');
    await updateMullvadStatus();
    res.json({ success: true, message: 'Mullvad disconnect command executed', output: result.stdout });
  } catch (error) {
    res.json({ success: false, message: 'Failed to disconnect Mullvad', error: error.error });
  }
});

app.post('/api/mullvad/set-location', async (req, res) => {
  try {
    const { location } = req.body;
    if (!location) {
      return res.json({ success: false, message: 'Location is required' });
    }

    const result = await execCommand(`mullvad relay set location ${location}`);
    await updateMullvadStatus();
    res.json({ success: true, message: 'Mullvad location set', output: result.stdout });
  } catch (error) {
    res.json({ success: false, message: 'Failed to set Mullvad location', error: error.error });
  }
});

app.get('/api/mullvad/status', async (req, res) => {
  try {
    await updateMullvadStatus();
    res.json({ success: true, status: mullvadStatus });
  } catch (error) {
    res.json({ success: false, message: 'Failed to get Mullvad status', error: error.message });
  }
});

app.get('/api/mullvad/locations', async (req, res) => {
  try {
    const result = await execCommand('mullvad relay list');
    const locations = parseMullvadLocations(result.stdout);
    res.json({ success: true, locations });
  } catch (error) {
    res.json({ success: false, message: 'Failed to get Mullvad locations', error: error.error });
  }
});

// UTILITY FUNCTIONS

async function updateMullvadStatus() {
  try {
    const statusResult = await execCommand('mullvad status');
    const statusOutput = statusResult.stdout;

    mullvadStatus.connected = statusOutput.includes('Connected');
    
    if (mullvadStatus.connected) {
      // Extract location info
      const locationMatch = statusOutput.match(/Connected to (.+?) in (.+)/);
      if (locationMatch) {
        mullvadStatus.location = `${locationMatch[1]}, ${locationMatch[2]}`;
      }

      // Get IP address
      try {
        const ipResult = await execCommand('curl -s https://am.i.mullvad.net/json');
        const ipData = JSON.parse(ipResult.stdout);
        mullvadStatus.ip = ipData.ip;
      } catch (ipError) {
        console.log('Failed to get IP:', ipError);
      }
    } else {
      mullvadStatus.location = null;
      mullvadStatus.ip = null;
    }

    broadcastStatus();
  } catch (error) {
    console.log('Failed to update Mullvad status:', error);
  }
}

function parseMullvadLocations(output) {
  const locations = [];
  const lines = output.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('Country') && !trimmed.startsWith('City') && !trimmed.startsWith('Hostname')) {
      // Simple parsing - you might want to improve this based on actual mullvad output format
      if (trimmed.includes('\t') || trimmed.includes('  ')) {
        const parts = trimmed.split(/\s+/);
        if (parts.length >= 2) {
          locations.push({
            code: parts[0],
            name: parts.slice(1).join(' ')
          });
        }
      }
    }
  }
  
  return locations;
}

// NETWORK TESTING ENDPOINTS

app.get('/api/network/test-tor', async (req, res) => {
  try {
    // Test Tor connection by checking IP through Tor proxy
    const result = await execCommand('curl -s --socks5 127.0.0.1:9050 https://check.torproject.org/api/ip');
    const data = JSON.parse(result.stdout);
    res.json({ success: true, torEnabled: data.IsTor, ip: data.IP });
  } catch (error) {
    res.json({ success: false, message: 'Failed to test Tor connection', error: error.error });
  }
});

app.get('/api/network/test-mullvad', async (req, res) => {
  try {
    const result = await execCommand('curl -s https://am.i.mullvad.net/json');
    const data = JSON.parse(result.stdout);
    res.json({ success: true, mullvadEnabled: data.mullvad_exit_ip, ip: data.ip, country: data.country });
  } catch (error) {
    res.json({ success: false, message: 'Failed to test Mullvad connection', error: error.error });
  }
});

// GENERAL STATUS ENDPOINT

app.get('/api/status', async (req, res) => {
  await updateMullvadStatus();
  res.json({
    success: true,
    tor: torStatus,
    mullvad: mullvadStatus,
    timestamp: new Date().toISOString()
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log(`WebSocket server running on ws://localhost:${PORT}`);
  
  // Initial status update
  updateMullvadStatus();
});

// Cleanup on exit
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  
  if (torProcess && !torProcess.killed) {
    torProcess.kill('SIGTERM');
  }
  
  process.exit(0);
});

process.on('SIGTERM', () => {
  if (torProcess && !torProcess.killed) {
    torProcess.kill('SIGTERM');
  }
  
  process.exit(0);
}); 