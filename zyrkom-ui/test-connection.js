// Quick test script to verify backend connection
const fetch = require('node-fetch');

async function testBackend() {
  try {
    console.log('🧪 Testing Zyrkom backend connection...');
    
    // Test basic connection
    const response = await fetch('http://localhost:8080/health', {
      method: 'GET'
    });
    
    if (response.ok) {
      console.log('✅ Backend is running and accessible');
    } else {
      console.log('⚠️ Backend responded but with error:', response.status);
    }
    
  } catch (error) {
    console.log('❌ Backend connection failed:', error.message);
    console.log('💡 Make sure to run: npm run backend');
  }
}

// Test WebSocket connection
function testWebSocket() {
  const WebSocket = require('ws');
  
  try {
    console.log('🔌 Testing WebSocket connection...');
    const ws = new WebSocket('ws://localhost:8081');
    
    ws.on('open', () => {
      console.log('✅ WebSocket connected successfully');
      ws.close();
    });
    
    ws.on('error', (error) => {
      console.log('❌ WebSocket connection failed:', error.message);
    });
    
  } catch (error) {
    console.log('❌ WebSocket test failed:', error.message);
  }
}

testBackend();
setTimeout(testWebSocket, 1000);