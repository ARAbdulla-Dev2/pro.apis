const { getFbVideoInfo } = require("fb-downloader-scrapper");

const handleFbRequest = async (url) => {
  if (!url) throw new Error('Facebook video URL is required');

  const info = await getFbVideoInfo(url);

  return {
    success: true,
    url: info.url,
    title: info.title,
    thumbnail: info.thumbnail,
    duration: `${(info.duration_ms / 1000).toFixed(0)} sec`,
    sd: info.sd || null,
    hd: info.hd || null,
  };
};

module.exports = {
  handleFbRequest
};

