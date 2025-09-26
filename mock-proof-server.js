const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

console.log('🚀 Starting Mock Midnight Proof Server...');

// Mock endpoints
app.get('/health', (req, res) => {
  console.log('Health check requested');
  res.json({ 
    status: 'healthy', 
    version: 'mock-v4',
    server: 'HydraJTS Mock Proof Server',
    timestamp: new Date().toISOString()
  });
});

app.post('/generate', async (req, res) => {
  console.log('Proof generation requested:', req.body.circuitId);
  // Simulate proof generation delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  const proof = '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
  console.log('Proof generated:', proof.substring(0, 20) + '...');
  
  res.json({
    proof: proof,
    publicInputs: ['0x123', '0x456'],
    verificationKey: '0xVK_' + Date.now().toString(16),
    success: true
  });
});

app.post('/verify', async (req, res) => {
  console.log('Proof verification requested');
  await new Promise(resolve => setTimeout(resolve, 500));
  const valid = Math.random() > 0.1; // 90% success rate
  res.json({ valid });
});

app.post('/compile', async (req, res) => {
  console.log('Circuit compilation requested:', req.body.circuitId);
  await new Promise(resolve => setTimeout(resolve, 2000));
  res.json({
    provingKey: '0xPK_' + Date.now().toString(16),
    verificationKey: '0xVK_' + Date.now().toString(16)
  });
});

app.get('/circuits/:id', (req, res) => {
  console.log('Circuit info requested:', req.params.id);
  res.json({
    constraints: 10000,
    publicInputs: 2,
    privateInputs: 5,
    gates: 8000
  });
});

app.get('/metrics', (req, res) => {
  res.json({
    proofsGenerated: Math.floor(Math.random() * 100),
    averageTime: 2500,
    successRate: 0.95
  });
});

const PORT = process.env.PORT || 6300;
app.listen(PORT, () => {
  console.log(`✅ Mock Midnight Proof Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
});
