const { mediafire } = require('btch-downloader')

const url = 'https://www.mediafire.com/file/941xczxhn27qbby/GBWA_V12.25FF-By.SamMods-.apk/file'
mediafire(url).then(data => console.log(data)).catch(err => console.error(err)); // JSON