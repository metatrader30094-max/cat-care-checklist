const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';
const DATA_FILE = path.join(__dirname, 'data.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Initialize data file if not exists
function initData() {
  if (!fs.existsSync(DATA_FILE)) {
    const initialData = {
      lastUpdated: new Date().toISOString(),
      checks: {}
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
  }
}

function readData() {
  try {
    const content = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(content);
  } catch (e) {
    return { lastUpdated: new Date().toISOString(), checks: {} };
  }
}

function writeData(data) {
  data.lastUpdated = new Date().toISOString();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Get all check states
app.get('/api/checks', (req, res) => {
  const data = readData();
  res.json(data);
});

// Update a single check
app.post('/api/checks/:key', (req, res) => {
  const { key } = req.params;
  const { checked } = req.body;
  const data = readData();
  
  // Get today's date as key suffix
  const today = new Date().toISOString().split('T')[0];
  const checkKey = `${key}_${today}`;
  
  data.checks[checkKey] = {
    checked,
    timestamp: new Date().toISOString()
  };
  
  writeData(data);
  res.json({ success: true, key: checkKey, checked });
});

// Reset today's checks (for new day)
app.post('/api/reset', (req, res) => {
  const data = readData();
  const today = new Date().toISOString().split('T')[0];
  
  // Keep only today's checks
  const newChecks = {};
  Object.keys(data.checks).forEach(key => {
    if (key.endsWith(`_${today}`)) {
      newChecks[key] = data.checks[key];
    }
  });
  
  data.checks = newChecks;
  writeData(data);
  res.json({ success: true });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

initData();

app.listen(PORT, HOST, () => {
  console.log(`🐱 Cat Care App running at http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
});
