// modules/ig.js
const insta = require("priyansh-ig-downloader");

async function getInstagramMedia(url) {
  try {
    const result = await insta(url);
    return {
      success: true,
      data: result
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