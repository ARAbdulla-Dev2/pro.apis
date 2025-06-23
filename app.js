const express = require('express');
const cors = require('cors');
const ytdlp = require('yt-dlp-exec');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const app = express();
const PORT = 3334;

// ✅ Secure your API key
const VALID_API_KEY = 'AIzaSyB16u905w4V702Xvq81i0b2J9iX43mR85c';

// ✅ Allow all origins
app.use(cors());

// Helper function to fetch fresh cookies
async function getFreshCookies() {
  try {
    const response = await fetch('https://cdn.evelocore.com/files/users/arabdullah/api/youtube/cookies.txt');
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.text();
  } catch (err) {
    console.error('Failed to fetch cookies:', err);
    return ''; // Return empty string if cookies can't be fetched
  }
}

// Helper function to create and manage temporary cookies file
async function withTempCookies(cookiesData, callback) {
  const tempFilePath = path.join(__dirname, `cookies_${Date.now()}.txt`);
  
  try {
    // Write cookies to temp file
    await fs.promises.writeFile(tempFilePath, cookiesData);
    
    // Execute callback with temp file path
    const result = await callback(tempFilePath);
    return result;
  } finally {
    // Delete temp file whether successful or not
    try {
      await fs.promises.unlink(tempFilePath);
    } catch (err) {
      console.error('Error deleting temp cookies file:', err);
    }
  }
}

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

  // Get fresh cookies for each request
  const freshCookies = await getFreshCookies();

  const info = await withTempCookies(freshCookies, async (cookiePath) => {
    return await ytdlp(url, {
      dumpSingleJson: true,
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true,
      youtubeSkipDashManifest: true,
      cookies: cookiePath,
    });
  });

  const audioFormats = info.formats
    .filter(f => f.acodec !== 'none' && f.vcodec === 'none')
    .map(f => ({
      format: f.format,
      mimeType: f.ext,
      url: f.url,
      size: f.filesize ? `${(f.filesize / (1024 * 1024)).toFixed(2)} MB` : 'Unknown',
      bitrate: f.abr ? `${f.abr} kbps` : 'Unknown',
    }));

  if (!audioFormats.length) throw new Error('No audio formats found.');

  res.json({
    status: true,
    title: info.title,
    thumbnail: info.thumbnail,
    duration: info.duration_string || `${info.duration} sec`,
    availableFormats: audioFormats,
  });
}));

// ✅ /api/ytmp4 - Get video+audio formats
app.get('/api/ytmp4', validateApiKey, asyncHandler(async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'YouTube URL is required' });

  // Get fresh cookies for each request
  const freshCookies = await getFreshCookies();

  const info = await withTempCookies(freshCookies, async (cookiePath) => {
    return await ytdlp(url, {
      dumpSingleJson: true,
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true,
      youtubeSkipDashManifest: true,
      cookies: cookiePath,
    });
  });

  const videoFormats = info.formats
    .filter(f => f.vcodec !== 'none' && f.acodec !== 'none')
    .map(f => ({
      format: f.format,
      mimeType: f.ext,
      url: f.url,
      resolution: f.height ? `${f.height}p` : 'Unknown',
      size: f.filesize ? `${(f.filesize / (1024 * 1024)).toFixed(2)} MB` : 'Unknown',
      fps: f.fps || 'Unknown',
    }));

  if (!videoFormats.length) throw new Error('No video formats found.');

  res.json({
    status: true,
    title: info.title,
    thumbnail: info.thumbnail,
    duration: info.duration_string || `${info.duration} sec`,
    availableFormats: videoFormats,
  });
}));

// ✅ Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});