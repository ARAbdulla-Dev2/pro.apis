const { gdrive } = require('btch-downloader')

const url = 'https://drive.google.com/file/d/1thDYWcS5p5FFhzTpTev7RUv0VFnNQyZ4/view?usp=drivesdk'
gdrive(url).then(data => console.log(data)).catch(err => console.error(err)); // JSON