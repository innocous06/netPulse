const express = require('express');
const crypto = require('crypto');
const router = express.Router();

// Pre-allocate 4MB static random buffer in RAM once to maximize network throughput without CPU overhead
const DUMMY_BUFFER = crypto.randomBytes(4 * 1024 * 1024);

router.get('/download', (req, res) => {
  let sizeMB = parseInt(req.query.size, 10);
  if (isNaN(sizeMB)) sizeMB = 10;
  if (sizeMB > 100) sizeMB = 100;
  if (sizeMB < 1) sizeMB = 1;

  const sizeBytes = sizeMB * 1024 * 1024;
  let isClosed = false;

  req.on('close', () => {
    isClosed = true;
  });
  
  res.set({
    'Content-Type': 'application/octet-stream',
    'Content-Length': sizeBytes,
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    'Pragma': 'no-cache'
  });

  let sentBytes = 0;

  const sendChunk = () => {
    if (isClosed || res.writableEnded) return;
    while (sentBytes < sizeBytes && !isClosed) {
      const toSend = Math.min(DUMMY_BUFFER.length, sizeBytes - sentBytes);
      const chunk = DUMMY_BUFFER.subarray(0, toSend);
      sentBytes += toSend;
      
      if (!res.write(chunk)) {
        res.once('drain', sendChunk);
        return;
      }
    }
    if (!isClosed && !res.writableEnded) res.end();
  };
  
  sendChunk();
});

router.post('/upload', (req, res) => {
  const startTime = Date.now();
  let bytes = 0;
  let isAborted = false;

  req.on('aborted', () => {
    isAborted = true;
  });

  req.on('data', chunk => {
    if (!isAborted) bytes += chunk.length;
  });

  req.on('end', () => {
    if (isAborted || res.headersSent) return;
    const durationMs = Math.max(1, Date.now() - startTime);
    const bits = bytes * 8;
    const speedMbps = (bits / (durationMs / 1000)) / 1000000;
    
    res.json({
      success: true,
      bytes,
      durationMs,
      speedMbps: parseFloat(speedMbps.toFixed(2))
    });
  });

  req.on('error', (err) => {
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
});

module.exports = router;
