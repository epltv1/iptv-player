const axios = require('axios');
const url = require('url');

module.exports = async (req, res) => {
  try {
    // Get the target URL from query param or default to the provided stream
    const targetUrl = req.query.url || 'http://starshare.st:80/live/97536964/97526028/23342.m3u8';
    if (!targetUrl) {
      return res.status(400).json({ error: 'No URL provided' });
    }

    // Parse the target URL to handle relative segment paths
    const parsedUrl = url.parse(targetUrl);
    const baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}${parsedUrl.pathname.substring(0, parsedUrl.pathname.lastIndexOf('/'))}/`;

    // Fetch the resource
    const response = await axios.get(targetUrl, {
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
        'Referer': 'http://starshare.st/',
        'Origin': 'http://starshare.st'
      }
    });

    // Set CORS and content-type headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Content-Type', response.headers['content-type'] || 'application/vnd.apple.mpegurl');

    // If it's an m3u8 playlist, rewrite segment URLs to use the proxy
    if (targetUrl.endsWith('.m3u8')) {
      let playlistData = '';
      response.data.on('data', chunk => {
        playlistData += chunk.toString();
      });
      response.data.on('end', () => {
        // Rewrite segment URLs to use the proxy
        const rewrittenPlaylist = playlistData.replace(
          /(^[^#].*\.ts.*$)/gm,
          (match) => {
            const segmentUrl = match.startsWith('http') ? match : url.resolve(baseUrl, match);
            return `/api/proxy?url=${encodeURIComponent(segmentUrl)}`;
          }
        );
        res.send(rewrittenPlaylist);
      });
    } else {
      // Stream .ts segments or other files directly
      response.data.pipe(res);
    }
  } catch (error) {
    console.error('Proxy error:', error.message);
    res.status(500).json({ error: 'Failed to fetch the stream', details: error.message });
  }
};
