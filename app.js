const express = require('express');
const cors = require('cors');
const ytdl = require('@distube/ytdl-core');

const app = express();
const PORT = 3030;

const VALID_API_KEY = '123';
app.use(cors());

const validateApiKey = (req, res, next) => {
  if (req.query.apiKey !== VALID_API_KEY) {
    return res.status(403).json({ error: 'Invalid API Key' });
  }
  next();
};

app.get('/api/ytmp4', validateApiKey, async (req, res) => {
  const { url } = req.query;
  if (!url || !ytdl.validateURL(url)) {
    return res.status(400).json({ error: 'Invalid or missing YouTube URL' });
  }

  try {
    const info = await ytdl.getInfo(url);
    const formats = ytdl.filterFormats(info.formats, 'videoandaudio');

    const seenQualities = new Set();
    const result = formats.filter(f => {
      const isNew = !seenQualities.has(f.qualityLabel);
      if (isNew) seenQualities.add(f.qualityLabel);
      return isNew;
    }).map(f => ({
      quality: f.qualityLabel,
      mimeType: f.mimeType,
      size: f.contentLength ? `${(f.contentLength / 1024 / 1024).toFixed(2)} MB` : 'Unknown',
      url: f.url,
    }));

    res.json({
      title: info.videoDetails.title,
      thumbnail: info.videoDetails.thumbnails?.pop()?.url,
      formats: result,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get video info', details: err.message });
  }
});


app.get('/api/ytmp3', validateApiKey, async (req, res) => {
  const { url } = req.query;
  if (!url || !ytdl.validateURL(url)) {
    return res.status(400).json({ error: 'Invalid or missing YouTube URL' });
  }

  try {
    const info = await ytdl.getInfo(url);
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
    }));

    res.json({
      title: info.videoDetails.title,
      thumbnail: info.videoDetails.thumbnails?.pop()?.url,
      formats: result,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get audio info', details: err.message });
  }
});


app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
