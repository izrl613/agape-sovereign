const http = require('http');

let sessionId = null;

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function testMCP() {
  // Step 1: Connect to SSE and get session ID
  const sseOptions = {
    hostname: '127.0.0.1',
    port: 3001,
    path: '/sse',
    method: 'GET',
    headers: { 'Accept': 'text/event-stream' }
  };
  
  const sseReq = http.request(sseOptions, (res) => {
    res.on('data', (chunk) => {
      const text = chunk.toString();
      console.log('SSE data:', text);
      // Look for endpoint event with sessionId
      const match = text.match(/sessionId=([a-f0-9-]+)/);
      if (match && !sessionId) {
        sessionId = match[1];
        console.log('Found sessionId:', sessionId);
      }
    });
  });
  
  sseReq.on('error', (err) => console.error('SSE error:', err));
  sseReq.end();
  
  // Wait for session ID
  await new Promise(r => setTimeout(r, 3000));
  
  if (!sessionId) {
    console.error('Failed to get session ID');
    sseReq.destroy();
    return;
  }
  
  console.log('Using sessionId:', sessionId);
  
  // Step 2: Make tool call
  const postData = JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: { name: 'health_check', arguments: {} }
  });
  
  const msgOptions = {
    hostname: '127.0.0.1',
    port: 3001,
    path: `/message?sessionId=${sessionId}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  const result = await makeRequest(msgOptions, postData);
  console.log('Tool response:', result.status, result.body);
  
  sseReq.destroy();
}

testMCP().catch(console.error);