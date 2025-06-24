const { capcut } = require('btch-downloader')

const url = 'https://www.capcut.com/template-detail/7299286607478181121?template_id=7299286607478181121&share_token=80302b19-8026-4101-81df-2fd9a9cecb9c&enter_from=template_detail®ion=ID&language=in&platform=copy_link&is_copy_link=1'
capcut(url).then(data => console.log(data)).catch(err => console.error(err)); // JSON