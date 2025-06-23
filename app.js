const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { getAudioInfo, getVideoInfoWithFormats } = require('./modules/yt');
const { handleFbRequest } = require('./modules/fb');
const { getInstagramMedia } = require('./modules/ig');
const { getTikTokMedia } = require('./modules/tk');

const app = express();
const PORT = 3334;

// ✅ Constants
const VALID_API_KEY = 'AIzaSyB16u905w4V702Xvq81i0b2J9iX43mR85c';
const COOKIES_PATH = path.join(__dirname, 'cookies.txt');
const ORIGINS_PATH = path.join(__dirname, 'allowOrigins.json');

// ✅ Global CORS allow list (updated dynamically)
let allowList = ['http://localhost:3334', 'https://api.arabdullah.top', 'https://cdn.evelocore.com', 'https://dhero.evelocore.com'];

// ✅ Load origins from file at startup
async function loadAllowOrigins() {
  try {
    const data = await fs.readFile(ORIGINS_PATH, 'utf-8');
    allowList = JSON.parse(data);
    console.log('✅ Loaded allowOrigins:', allowList);
  } catch (err) {
    console.warn('⚠️ Could not load allowOrigins.json. Using default list.');
  }
}
loadAllowOrigins();

// ✅ CORS middleware (dynamic origin check)
const corsOptionsDelegate = function (req, callback) {
  const origin = req.header('Origin');
  const isAllowed = allowList.includes(origin);
  const corsOptions = {
    origin: isAllowed,
    credentials: true,
  };
  callback(null, corsOptions);
};

// ✅ Middleware
app.use(cors(corsOptionsDelegate));
app.use(express.json());

// ✅ API key validation
const validateApiKey = (req, res, next) => {
  if (req.query.apiKey !== VALID_API_KEY) {
    return res.status(403).json({ error: 'Invalid API Key' });
  }
  next();
};

// ✅ Async error wrapper
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch((err) => {
    console.error('API Error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  });

// Generic endpoint handler
const createEndpointHandler = (serviceFunction, platformName, urlRegex = null) => {
  return async (req, res) => {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: `${platformName} URL is required` });
    }

    if (urlRegex && !url.match(urlRegex)) {
      return res.status(400).json({ error: `Invalid ${platformName} URL format` });
    }

    try {
      const result = await serviceFunction(url);
      
      // Handle different response structures
      if (result && typeof result === 'object' && 'success' in result) {
        if (!result.success) {
          return res.status(500).json({ error: result.error });
        }
        return res.json(result.data);
      }
      
      return res.json(result);
    } catch (error) {
      console.error(`Error processing ${platformName} request:`, error);
      return res.status(500).json({ error: `Failed to process ${platformName} URL` });
    }
  };
};

// Define URL validation patterns
const URL_PATTERNS = {
  INSTAGRAM: /https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[a-zA-Z0-9_-]+/,
  TIKTOK: /https?:\/\/(www\.)?tiktok\.com\/@.+\/video\/\d+/
};

// Routes
app.get('/api/ytmp3', validateApiKey, createEndpointHandler(getAudioInfo, 'YouTube'));
app.get('/api/ytmp4', validateApiKey, createEndpointHandler(getVideoInfoWithFormats, 'YouTube'));
app.get('/api/fb', validateApiKey, createEndpointHandler(handleFbRequest, 'Facebook'));
app.get('/api/ig', validateApiKey, createEndpointHandler(getInstagramMedia, 'Instagram', URL_PATTERNS.INSTAGRAM));
app.get('/api/tk', validateApiKey, createEndpointHandler(getTikTokMedia, 'TikTok', URL_PATTERNS.TIKTOK));

// ✅ App data config (cookies + allowed origins)
app.post('/api/update-appdata', asyncHandler(async (req, res) => {
  const { action, cookies_txt, origins } = req.body;

  if (!action) return res.status(400).json({ error: 'Action required' });

  if (action === 'get') {
    let cookiesText = '';
    let allowOrigins = ['api.arabdullah.top'];

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
      allowList = origins; // ✅ Update in-memory CORS allow list
      result.allowOrigins = 'updated';
    }

    return res.json({ success: true, ...result });
  }

  res.status(400).json({ error: 'Invalid action' });
}));

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
