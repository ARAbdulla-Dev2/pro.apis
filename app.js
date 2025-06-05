const express = require('express');
const cors = require('cors');
const ytdl = require('@distube/ytdl-core');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { getRandomIPv6 } = require('@distube/ytdl-core/lib/utils');

const app = express();
const PORT = 3000;

const VALID_API_KEY = '123';
app.use(cors());

// 1. Proper Cookie Format (only essential cookies)
const YOUTUBE_COOKIES = [
  { name: 'PREF', value: 'tz=Asia.Colombo&f7=140&repeat=NONE&f5=30000&gl=LK&f6=400400&guide_collapsed=false&autoplay=true' },
  { name: 'SID', value: 'g.a000xggo13jExi45bQEb37993RdGYfzHBG-Lp5DpmTC4JXTkzXCQD9f1u2mZNtRE0n19tJR-XAACgYKAX8SARUSFQHGX2MiXF8n6CchqWxVR3xuIu3wARoVAUF8yKqYxgtG_GQrb3P-FaKqQr8f0076' },
  { name: '__Secure-3PAPISID', value: '1E97_Ogga9S3nlCQ/Ai3WJZJ8z87rg_Wo8' }
];

// 2. Proxy Configuration (recommended for production)
const PROXY_URL = process.env.PROXY_URL || null;

// 3. Create agent with proper IP rotation
const createAgent = () => {
  if (PROXY_URL) {
    return new HttpsProxyAgent(PROXY_URL);
  }
  
  return ytdl.createAgent(YOUTUBE_COOKIES, {
    localAddress: getRandomIPv6("2001:2::/48"),
    pipelining: 3,
    keepAlive: true
  });
};

// 4. Enhanced Request Headers
const getRequestHeaders = () => ({
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
  'X-YouTube-Client-Name': '1',
  'X-YouTube-Client-Version': '2.20231219.09.00',
  'Origin': 'https://www.youtube.com',
  'Referer': 'https://www.youtube.com/'
});

const validateApiKey = (req, res, next) => {
  if (req.query.apiKey !== VALID_API_KEY) {
    return res.status(403).json({ error: 'Invalid API Key' });
  }
  next();
};

// 5. Error Handling with Retry Logic
const getInfoWithRetry = async (url, retries = 3) => {
  let lastError;
  
  for (let i = 0; i < retries; i++) {
    try {
      const agent = createAgent();
      const options = {
        agent,
        requestOptions: {
          headers: getRequestHeaders()
        },
        lang: 'en'
      };
      return await ytdl.getInfo(url, options);
    } catch (err) {
      lastError = err;
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }
  
  throw lastError;
};

// 6. Route Handlers
app.get('/api/ytmp4', validateApiKey, async (req, res) => {
  try {
    const { url } = req.query;
    if (!url || !ytdl.validateURL(url)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    const info = await getInfoWithRetry(url);
    const formats = ytdl.filterFormats(info.formats, 'videoandaudio');
    
    const result = [...new Map(
      formats.map(f => [f.qualityLabel, {
        quality: f.qualityLabel,
        mimeType: f.mimeType,
        size: f.contentLength ? `${(f.contentLength / 1024 / 1024).toFixed(2)} MB` : 'Unknown',
        url: f.url,
        itag: f.itag
      }])
    ).values()];

    res.json({
      title: info.videoDetails.title,
      thumbnail: info.videoDetails.thumbnails?.slice(-1)[0]?.url,
      duration: parseInt(info.videoDetails.lengthSeconds),
      formats: result
    });
  } catch (err) {
    console.error('YTMP4 Error:', err.message);
    res.status(500).json({ 
      error: 'Failed to get video info',
      details: err.message.includes('bot') ? 
        'YouTube bot detection triggered. Try again later or use different IP.' : 
        err.message
    });
  }
});

app.get('/api/ytmp3', validateApiKey, async (req, res) => {
  try {
    const { url } = req.query;
    if (!url || !ytdl.validateURL(url)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    const info = await getInfoWithRetry(url);
    const formats = ytdl.filterFormats(info.formats, 'audioonly');
    
    const result = [...new Map(
      formats.map(f => [f.audioBitrate, {
        bitrate: f.audioBitrate,
        mimeType: f.mimeType,
        size: f.contentLength ? `${(f.contentLength / 1024 / 1024).toFixed(2)} MB` : 'Unknown',
        url: f.url,
        itag: f.itag
      }])
    ).values()];

    res.json({
      title: info.videoDetails.title,
      thumbnail: info.videoDetails.thumbnails?.slice(-1)[0]?.url,
      duration: parseInt(info.videoDetails.lengthSeconds),
      formats: result
    });
  } catch (err) {
    console.error('YTMP3 Error:', err.message);
    res.status(500).json({ 
      error: 'Failed to get audio info',
      details: err.message.includes('bot') ? 
        'YouTube bot detection triggered. Try again later or use different IP.' : 
        err.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Using cookies: ${YOUTUBE_COOKIES.length > 0 ? 'Yes' : 'No'}`);
  console.log(`Using proxy: ${PROXY_URL ? 'Yes' : 'No'}`);
});