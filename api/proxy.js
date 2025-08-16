const axios = require('axios');

module.exports = async (req, res) => {
  try {
    const targetUrl = 'http://starshare.st:80/live/97536964/97526028/23342.m3u8';
    const response = await axios.get(targetUrl, {
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
        'Referer': 'http://starshare.st', // Mimic browser behavior
        'Origin': 'http://starshare.st'   // Adjust if needed
      }
    });

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Content-Type', response.headers['content-type'] || 'application/vnd.apple.mpegurl');

    // Pipe the stream to the client
    response.data.pipe(res);
  } catch (error) {
    console.error('Proxy error:', error.message);
    res.status(500).json({ error: 'Failed to fetch the stream', details: error.message });
  }
};
