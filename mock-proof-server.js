const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Mock endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', version: 'mock-v4' });
});

app.post('/generate', async (req, res) => {
  // Simulate proof generation delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  res.json({
    proof: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
    publicInputs: ['0x123', '0x456'],
    verificationKey: '0xVK_' + Date.now().toString(16),
    success: true
  });
});

app.post('/verify', async (req, res) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  res.json({ valid: Math.random() > 0.1 }); // 90% success rate
});

app.post('/compile', async (req, res) => {
  await new Promise(resolve => setTimeout(resolve, 2000));
  res.json({
    provingKey: '0xPK_' + Date.now().toString(16),
    verificationKey: '0xVK_' + Date.now().toString(16)
  });
});

app.get('/circuits/:id', (req, res) => {
  res.json({
    constraints: 10000,
    publicInputs: 2,
    privateInputs: 5,
    gates: 8000
  });
});

const PORT = process.env.PORT || 6300;
app.listen(PORT, () => {
  console.log(`Mock Midnight Proof Server running on port ${PORT}`);
});
