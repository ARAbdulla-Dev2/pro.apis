const express = require('express');
const cors = require('cors');
const ytdl = require('@distube/ytdl-core');
const axios = require('axios');

const app = express();
const PORT = 3030;

const VALID_API_KEY = '123';
app.use(cors());

// Configure your YouTube cookies here (get them from browser console)
const YOUTUBE_COOKIES = process.env.YT_COOKIES || '_ga=GA1.1.618009050.1732347567; _ga_R3HTL8G9BH=GS1.2.1737521404.2.1.1737521561.0.0.0; _ga_5RPMD1E2GM=GS1.1.1737521402.2.1.1737521998.60.0.0; yt-dev.storage-integrity=true; _ga_VCGEPY40VB=GS1.1.1738564144.3.1.1738564320.30.0.0; APISID=l_Mxlk59K6yV_4b0/A_QoxJ45a2e7EUvaS; SAPISID=1E97_Ogga9S3nlCQ/Ai3WJZJ8z87rg_Wo8; __Secure-1PAPISID=1E97_Ogga9S3nlCQ/Ai3WJZJ8z87rg_Wo8; __Secure-3PAPISID=1E97_Ogga9S3nlCQ/Ai3WJZJ8z87rg_Wo8; yt.leanback.default::app-start-timestamp-cookie=NIL; PREF=tz=Asia.Colombo&f7=140&repeat=NONE&f5=30000&gl=LK&f6=400400&guide_collapsed=false&autoplay=true; SID=g.a000xggo13jExi45bQEb37993RdGYfzHBG-Lp5DpmTC4JXTkzXCQD9f1u2mZNtRE0n19tJR-XAACgYKAX8SARUSFQHGX2MiXF8n6CchqWxVR3xuIu3wARoVAUF8yKqYxgtG_GQrb3P-FaKqQr8f0076; mp_019f8d3b3c6f14bc44059f75f61582e7_mixpanel=%7B%22distinct_id%22%3A%20%22%24device%3A192a4b6eb20d715-00db05d7d3fb07-26001a51-1fa400-192a4b6eb20d715%22%2C%22%24device_id%22%3A%20%22192a4b6eb20d715-00db05d7d3fb07-26001a51-1fa400-192a4b6eb20d715%22%2C%22%24initial_referrer%22%3A%20%22https%3A%2F%2Fwww.youtube.com%2F%22%2C%22%24initial_referring_domain%22%3A%20%22www.youtube.com%22%2C%22%24search_engine%22%3A%20%22google%22%7D; SIDCC=AKEyXzXbNEVDrimesGnQED9OnHUnan5PSt58bqhqaMZOJ0gRu2_uUc_oZqSa14GJfz66BnackCY';

// List of user agents to rotate
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/120.0',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
];

const validateApiKey = (req, res, next) => {
  if (req.query.apiKey !== VALID_API_KEY) {
    return res.status(403).json({ error: 'Invalid API Key' });
  }
  next();
};

const getRandomUserAgent = () => {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
};

const getYtdlOptions = () => {
  return {
    requestOptions: {
      headers: {
        cookie: YOUTUBE_COOKIES,
        'User-Agent': getRandomUserAgent(),
        'Accept-Language': 'en-US,en;q=0.9',
        'X-YouTube-Client-Name': '1',
        'X-YouTube-Client-Version': '2.20231219.09.00'
      }
    },
    lang: 'en'
  };
};

// Middleware to handle errors consistently
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    details: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

app.get('/api/ytmp4', validateApiKey, async (req, res, next) => {
  try {
    const { url } = req.query;
    if (!url || !ytdl.validateURL(url)) {
      return res.status(400).json({ error: 'Invalid or missing YouTube URL' });
    }

    const options = getYtdlOptions();
    const info = await ytdl.getInfo(url, options);
    
    const formats = ytdl.filterFormats(info.formats, 'videoandaudio');
    const seenQualities = new Set();
    
    const result = formats.filter(f => {
      const isNew = !seenQualities.has(f.qualityLabel);
      if (isNew) seenQualities.add(f.qualityLabel);
      return isNew && f.hasVideo && f.hasAudio;
    }).map(f => ({
      quality: f.qualityLabel,
      mimeType: f.mimeType,
      size: f.contentLength ? `${(f.contentLength / 1024 / 1024).toFixed(2)} MB` : 'Unknown',
      url: f.url,
      itag: f.itag,
      fps: f.fps,
      bitrate: `${(f.bitrate / 1000).toFixed(0)} kbps`
    }));

    res.json({
      title: info.videoDetails.title,
      thumbnail: getBestThumbnail(info.videoDetails.thumbnails),
      duration: info.videoDetails.lengthSeconds,
      formats: result,
    });
  } catch (err) {
    next(err);
  }
});

app.get('/api/ytmp3', validateApiKey, async (req, res, next) => {
  try {
    const { url } = req.query;
    if (!url || !ytdl.validateURL(url)) {
      return res.status(400).json({ error: 'Invalid or missing YouTube URL' });
    }

    const options = getYtdlOptions();
    const info = await ytdl.getInfo(url, options);
    const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
    
    const seenBitrates = new Set();
    const result = audioFormats.filter(f => {
      const isNew = !seenBitrates.has(f.audioBitrate);
      if (isNew) seenBitrates.add(f.audioBitrate);
      return isNew;
    }).map(f => ({
      bitrate: f.audioBitrate,
      mimeType: f.mimeType,
      size: f.contentLength ? `${(f.contentLength / 1024 / 1024).toFixed(2)} MB` : 'Unknown',
      url: f.url,
      itag: f.itag
    }));

    res.json({
      title: info.videoDetails.title,
      thumbnail: getBestThumbnail(info.videoDetails.thumbnails),
      duration: info.videoDetails.lengthSeconds,
      formats: result,
    });
  } catch (err) {
    next(err);
  }
});

// Helper function to get the highest quality thumbnail
function getBestThumbnail(thumbnails) {
  if (!thumbnails || thumbnails.length === 0) return null;
  return thumbnails.reduce((best, current) => 
    (current.width > best.width) ? current : best
  ).url;
}

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Using cookies: ${YOUTUBE_COOKIES ? 'Yes' : 'No'}`);
});