const express = require('express');
const cors = require('cors');
const ytdlp = require('yt-dlp-exec');
const app = express();
const PORT = 3000;

const VALID_API_KEY = '123'; // Secure your API key
app.use(cors());

// API key middleware
const validateApiKey = (req, res, next) => {
  if (req.query.apiKey !== VALID_API_KEY) {
    return res.status(403).json({ error: 'Invalid API Key' });
  }
  next();
};

// Async handler
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch((error) => {
    console.error('API Error:', error);
    res.status(500).json({
      error: 'Failed to process request',
      details: error.message,
    });
  });

// /api/ytmp3 - audio formats
app.get('/api/ytmp3', validateApiKey, asyncHandler(async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'YouTube URL is required' });

  const info = await ytdlp(url, {
    dumpSingleJson: true,
    noCheckCertificates: true,
    noWarnings: true,
    preferFreeFormats: true,
    youtubeSkipDashManifest: true,
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

// /api/ytmp4 - video+audio formats
app.get('/api/ytmp4', validateApiKey, asyncHandler(async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'YouTube URL is required' });

  const info = await ytdlp(url, {
    dumpSingleJson: true,
    noCheckCertificates: true,
    noWarnings: true,
    preferFreeFormats: true,
    youtubeSkipDashManifest: true,
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
