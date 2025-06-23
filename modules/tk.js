// modules/tk.js
const { ttdl } = require('btch-downloader');

async function getTikTokMedia(url) {
  try {
    const data = await ttdl(url);
    
    // Format the response to match your frontend structure
    const formattedData = {
      developer: '@prm2.0',
      title: data.title || '',
      title_audio: data.title_audio || '',
      thumbnail: data.thumbnail || '',
      video: data.video || [],
      audio: data.audio || []
    };

    return {
      success: true,
      data: formattedData
    };
  } catch (error) {
    console.error("Error fetching TikTok data:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  getTikTokMedia
};