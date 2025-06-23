const ytdlp = require('yt-dlp-exec');
const fs = require('fs');
const path = require('path');

// Path to the cookies file
const COOKIES_PATH = path.join(__dirname, '../cookies.txt');

// Common yt-dlp options
const baseOptions = {
  dumpSingleJson: true,
  noCheckCertificates: true,
  noWarnings: true,
  preferFreeFormats: true,
  youtubeSkipDashManifest: true
};

// Verify cookies file exists
function verifyCookiesFile() {
  if (!fs.existsSync(COOKIES_PATH)) {
    throw new Error('Cookies file not found. Please ensure ../cookies.txt exists');
  }
}

// Get video info with cookies
async function getVideoInfo(url) {
  verifyCookiesFile();
  return await ytdlp(url, {
    ...baseOptions,
    cookies: COOKIES_PATH
  });
}

// Process audio formats
function processAudioFormats(info) {
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

  return {
    success: true,
    title: info.title,
    thumbnail: info.thumbnail,
    duration: info.duration_string || `${info.duration} sec`,
    availableFormats: audioFormats,
  };
}

// Process video formats
function processVideoFormats(info) {
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

  return {
    success: true,
    title: info.title,
    thumbnail: info.thumbnail,
    duration: info.duration_string || `${info.duration} sec`,
    availableFormats: videoFormats,
  };
}

// Get audio info
async function getAudioInfo(url) {
  const info = await getVideoInfo(url);
  return processAudioFormats(info);
}

// Get video info
async function getVideoInfoWithFormats(url) {
  const info = await getVideoInfo(url);
  return processVideoFormats(info);
}

module.exports = {
  getAudioInfo,
  getVideoInfoWithFormats,
  verifyCookiesFile // Export for app.js to check at startup
};