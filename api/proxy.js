const axios = require('axios');

module.exports = async (req, res) => {
  try {
    const targetUrl = 'http://starshare.st:80/live/97536964/97526028/23342.m3u8';
    const response = await axios.get(targetUrl, { responseType: 'stream' });

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Content-Type', response.headers['content-type']);

    response.data.pipe(res);
  } catch (error) {
    console.error('Proxy error:', error.message);
    res.status(500).json({ error: 'Failed to fetch the stream' });
  }
};
