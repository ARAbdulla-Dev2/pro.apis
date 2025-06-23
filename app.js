const express = require('express');
const cors = require('cors');
const { getAudioInfo, getVideoInfoWithFormats } = require('./modules/yt');
const app = express();
const fs = require('fs').promises;
const path = require('path');
const PORT = 3334;

// ✅ Secure your API key
const VALID_API_KEY = 'AIzaSyB16u905w4V702Xvq81i0b2J9iX43mR85c';

// ✅ Allow all origins
app.use(cors());
app.use(express.json());

// ✅ API key middleware
const validateApiKey = (req, res, next) => {
  if (req.query.apiKey !== VALID_API_KEY) {
    return res.status(403).json({ error: 'Invalid API Key' });
  }
  next();
};

// ✅ Async error handler
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch((error) => {
    console.error('API Error:', error);
    res.status(500).json({
      error: 'Failed to process request',
      details: error.message,
    });
  });

// ✅ /api/ytmp3 - Get audio formats
app.get('/api/ytmp3', validateApiKey, asyncHandler(async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'YouTube URL is required' });
  
  const result = await getAudioInfo(url);
  res.json(result);
}));

// ✅ /api/ytmp4 - Get video+audio formats
app.get('/api/ytmp4', validateApiKey, asyncHandler(async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'YouTube URL is required' });
  
  const result = await getVideoInfoWithFormats(url);
  res.json(result);
}));

// ✅ /api/ytmp4 - Get video+audio formats
app.post('/api/update-appdata', (async (req, res) => {
  const COOKIES_PATH = path.join(__dirname, 'cookies.txt');
  const ORIGINS_PATH = path.join(__dirname, 'allowOrigins.json');

  const { action, cookies_txt, origins } = req.body;

  if (!action) return res.status(400).json({ error: 'Action required' });

  if (action === 'get') {
    let cookiesText = '';
    let allowOrigins = ['api.arabdullah.top']; // default

    try {
      cookiesText = await fs.readFile(COOKIES_PATH, 'utf-8');
    } catch (err) {
      cookiesText = '';
    }

    try {
      const originsData = await fs.readFile(ORIGINS_PATH, 'utf-8');
      allowOrigins = JSON.parse(originsData);
    } catch (err) {
      allowOrigins = ['api.arabdullah.top'];
    }

    return res.json({ cookies_txt: cookiesText, allowOrigins });
  }
  if (action === 'update') {
    const result = {};

    if (cookies_txt !== undefined) {
      await fs.writeFile(COOKIES_PATH, cookies_txt, 'utf-8');
      result.cookies_txt = 'updated';
    }

    if (origins !== undefined) {
      await fs.writeFile(ORIGINS_PATH, JSON.stringify(origins, null, 2), 'utf-8');
      result.allowOrigins = 'updated';
    }

    return res.json({ success: true, ...result });
  }
}));

// ✅ Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});