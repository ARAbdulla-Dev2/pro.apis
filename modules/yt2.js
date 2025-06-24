// modules/yt2.js
const { youtube } = require('btch-downloader');

async function getYT2Media(url) {
  try {
    const data = await youtube(url);
    
    // Check if data exists (since it's not an array)
    if (!data || typeof data !== 'object') {
      throw new Error('No video data found');
    }
    
    // Format the response to match your frontend structure
    const formattedData = {
      title: data.title || 'No title available',
      thumbnail: data.thumbnail || 'No thumbnail available',
      author: data.author || 'Unknown author',
      mp3: data.mp3 || null,
      mp4: data.mp4 || null
    };

    return {
      success: true,
      data: formattedData
    };
  } catch (error) {
    console.error("Error fetching YouTube data:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  getYT2Media
};