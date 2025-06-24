// modules/fb2.js
const { fbdown } = require('btch-downloader')

async function getFb2(url) {
  try {
    const data = await fbdown(url);
    
    // Check if data exists (since it's not an array)
    if (!data || typeof data !== 'object') {
      throw new Error('No video data found');
    }
    
    // Format the response to match your frontend structure
    const formattedData = {
      SD: data.Normal_video || null,
      HD: data.HD || null
    };

    return {
      success: true,
      data: formattedData
    };
  } catch (error) {
    console.error("Error fetching Facebook data:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  getFb2
};