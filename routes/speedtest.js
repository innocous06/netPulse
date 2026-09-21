const express = require('express');
const crypto = require('crypto');
const router = express.Router();

// Pre-allocate 4MB static random buffer in RAM once to maximize network throughput without CPU overhead
const DUMMY_BUFFER = crypto.randomBytes(4 * 1024 * 1024);

router.get('/download', (req, res) => {
  let sizeMB = parseInt(req.query.size) || 10;
  if (sizeMB > 100) sizeMB = 100;
  if (sizeMB < 1) sizeMB = 1;

  const sizeBytes = sizeMB * 1024 * 1024;
  
  res.set({
    'Content-Type': 'application/octet-stream',
    'Content-Length': sizeBytes,
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    'Pragma': 'no-cache'
  });

  let sentBytes = 0;

  const sendChunk = () => {
    while (sentBytes < sizeBytes) {
      const toSend = Math.min(DUMMY_BUFFER.length, sizeBytes - sentBytes);
      const chunk = DUMMY_BUFFER.subarray(0, toSend);
      sentBytes += toSend;
      
      if (!res.write(chunk)) {
        res.once('drain', sendChunk);
        return;
      }
    }
    res.end();
  };
  
  sendChunk();
});

router.post('/upload', express.raw({ type: '*/*', limit: '100mb' }), (req, res) => {
  const startTime = req.headers['x-start-time'] ? parseInt(req.headers['x-start-time'], 10) : Date.now();
  const endTime = Date.now();
  
  const bytes = req.body ? req.body.length : 0;
  const durationMs = Math.max(1, endTime - startTime);
  
  const bits = bytes * 8;
  const speedMbps = (bits / (durationMs / 1000)) / 1000000;
  
  res.json({ 
    success: true,
    bytes, 
    durationMs, 
    speedMbps: parseFloat(speedMbps.toFixed(2))
  });
});

module.exports = router;
