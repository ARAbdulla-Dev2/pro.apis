// modules/ig.js
const { igdl } = require('btch-downloader');

async function getInstagramMedia(url) {
  try {
    const data = await igdl(url);
    
    // Format the response to match your frontend structure
    const formattedData = data.map(item => ({
      thumbnail: item.thumbnail || '',
      url: item.url,
      resolution: item.resolution || undefined,
      shouldRender: undefined
    }));

    return {
      success: true,
      data: formattedData
    };
  } catch (error) {
    console.error("Error fetching Instagram data:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  getInstagramMedia
};