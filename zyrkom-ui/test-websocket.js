const WebSocket = require('ws');

console.log('🧪 Testing Zyrkom WebSocket Connection...');

function testWebSocketConnection() {
  const ws = new WebSocket('ws://localhost:8081');
  
  ws.on('open', () => {
    console.log('✅ WebSocket connection successful!');
    console.log('📡 Sending test message...');
    
    // Send a test message
    ws.send(JSON.stringify({
      type: 'test',
      message: 'Hello from test client'
    }));
    
    // Close after 2 seconds
    setTimeout(() => {
      ws.close();
      console.log('🔚 Test completed successfully');
      process.exit(0);
    }, 2000);
  });
  
  ws.on('message', (data) => {
    console.log('📩 Received message:', data.toString());
  });
  
  ws.on('error', (error) => {
    console.error('❌ WebSocket connection failed:', error.message);
    console.log('\n🔍 Troubleshooting:');
    console.log('1. Make sure backend is running: node backend/server.js');
    console.log('2. Check if port 8081 is available');
    console.log('3. Verify no firewall blocking connection');
    process.exit(1);
  });
  
  ws.on('close', (code, reason) => {
    console.log(`📴 WebSocket closed (code: ${code}, reason: ${reason})`);
  });
}

// Test HTTP backend first
const http = require('http');

console.log('🔍 Testing HTTP backend on port 8080...');

const req = http.get('http://localhost:8080/health', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('✅ HTTP backend is running');
    console.log('📊 Health check response:', JSON.parse(data));
    
    // Now test WebSocket
    console.log('\n🔗 Testing WebSocket connection...');
    testWebSocketConnection();
  });
}).on('error', (error) => {
  console.error('❌ HTTP backend not running:', error.message);
  console.log('\n🚨 SOLUTION: Start the backend first:');
  console.log('cd zyrkom-ui');
  console.log('node backend/server.js');
  process.exit(1);
});