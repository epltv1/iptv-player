const express = require('express');
const fetch = require('node-fetch').default;
const app = express();

app.get('/api/v1/streamingProxy', async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) {
      return res.status(400).json({ error: 'No URL provided' });
    }

    const parsedUrl = new URL(url);
    const baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}${parsedUrl.pathname.substring(0, parsedUrl.pathname.lastIndexOf('/'))}/`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
        'Referer': 'http://starshare.st/',
        'Origin': 'http://starshare.st'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    res.set({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Content-Type': response.headers.get('content-type') || 'application/vnd.apple.mpegurl'
    });

    if (url.endsWith('.m3u8')) {
      let playlistData = '';
      response.body.on('data', chunk => {
        playlistData += chunk.toString();
      });
      response.body.on('end', () => {
        const rewrittenPlaylist = playlistData.replace(
          /(^[^#].*\.ts.*$)/gm,
          (match) => {
            const segmentUrl = match.startsWith('http') ? match : new URL(match, baseUrl).href;
            return `/api/v1/streamingProxy?url=${encodeURIComponent(segmentUrl)}`;
          }
        );
        res.send(rewrittenPlaylist);
      });
    } else {
      response.body.pipe(res);
    }
  } catch (error) {
    console.error('Proxy error:', error.message);
    res.status(500).json({ error: 'Failed to fetch the stream', details: error.message });
  }
});

// Serve static files
app.use(express.static('public'));

module.exports = app;
