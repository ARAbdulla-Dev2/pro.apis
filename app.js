const express = require('express');
const cors = require('cors');
const ytdl = require('@distube/ytdl-core');

const app = express();
const PORT = 3030;

const VALID_API_KEY = '123';
const YOUTUBE_COOKIES = '_ga=GA1.1.618009050.1732347567; _ga_R3HTL8G9BH=GS1.2.1737521404.2.1.1737521561.0.0.0; _ga_5RPMD1E2GM=GS1.1.1737521402.2.1.1737521998.60.0.0; yt-dev.storage-integrity=true; _ga_VCGEPY40VB=GS1.1.1738564144.3.1.1738564320.30.0.0; APISID=l_Mxlk59K6yV_4b0/A_QoxJ45a2e7EUvaS; SAPISID=1E97_Ogga9S3nlCQ/Ai3WJZJ8z87rg_Wo8; __Secure-1PAPISID=1E97_Ogga9S3nlCQ/Ai3WJZJ8z87rg_Wo8; __Secure-3PAPISID=1E97_Ogga9S3nlCQ/Ai3WJZJ8z87rg_Wo8; yt.leanback.default::app-start-timestamp-cookie=NIL; PREF=tz=Asia.Colombo&f7=140&repeat=NONE&f5=30000&gl=LK&f6=400400&guide_collapsed=false&autoplay=true; SID=g.a000xggo13jExi45bQEb37993RdGYfzHBG-Lp5DpmTC4JXTkzXCQD9f1u2mZNtRE0n19tJR-XAACgYKAX8SARUSFQHGX2MiXF8n6CchqWxVR3xuIu3wARoVAUF8yKqYxgtG_GQrb3P-FaKqQr8f0076; mp_019f8d3b3c6f14bc44059f75f61582e7_mixpanel=%7B%22distinct_id%22%3A%20%22%24device%3A192a4b6eb20d715-00db05d7d3fb07-26001a51-1fa400-192a4b6eb20d715%22%2C%22%24device_id%22%3A%20%22192a4b6eb20d715-00db05d7d3fb07-26001a51-1fa400-192a4b6eb20d715%22%2C%22%24initial_referrer%22%3A%20%22https%3A%2F%2Fwww.youtube.com%2F%22%2C%22%24initial_referring_domain%22%3A%20%22www.youtube.com%22%2C%22%24search_engine%22%3A%20%22google%22%7D; SIDCC=AKEyXzXbNEVDrimesGnQED9OnHUnan5PSt58bqhqaMZOJ0gRu2_uUc_oZqSa14GJfz66BnackCY'; // Paste your cookie string here
app.use(cors());

const validateApiKey = (req, res, next) => {
  if (req.query.apiKey !== VALID_API_KEY) {
    return res.status(403).json({ error: 'Invalid API Key' });
  }
  next();
};

const getInfoOptions = {
  requestOptions: {
    headers: {
      cookie: YOUTUBE_COOKIES,
    }
  }
};

app.get('/api/ytmp4', validateApiKey, async (req, res) => {
  const { url } = req.query;
  if (!url || !ytdl.validateURL(url)) {
    return res.status(400).json({ error: 'Invalid or missing YouTube URL' });
  }

  try {
    const info = await ytdl.getInfo(url, getInfoOptions);
    // ... rest of your existing code ...
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
    const info = await ytdl.getInfo(url, getInfoOptions);
    // ... rest of your existing code ...
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get audio info', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});