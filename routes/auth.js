const express = require('express');
const { PIN, RATE_LIMIT } = require('../config');

const router = express.Router();
const loginAttempts = new Map();

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers['x-real-ip'] || req.socket.remoteAddress || 'unknown';
};

// Cleanup routine
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of loginAttempts.entries()) {
    if (now - data.firstAttempt > RATE_LIMIT.windowMs) {
      loginAttempts.delete(ip);
    }
  }
}, RATE_LIMIT.windowMs);

const handleLogin = (req, res) => {
  const ip = getClientIp(req);
  const now = Date.now();
  const activePin = process.env.NETPULSE_PIN || PIN || '060606';
  
  let attemptData = loginAttempts.get(ip) || { count: 0, firstAttempt: now };
  
  if (now - attemptData.firstAttempt > RATE_LIMIT.windowMs) {
    attemptData = { count: 0, firstAttempt: now };
  }

  if (attemptData.count >= RATE_LIMIT.maxAttempts) {
    return res.status(429).json({ success: false, message: 'Too many attempts. Rate limited for 15 mins.' });
  }

  const { pin } = req.body || {};
  if (!pin || typeof pin !== 'string') {
    return res.status(400).json({ success: false, message: 'Valid PIN string is required' });
  }
  
  if (String(pin).trim() === String(activePin).trim()) {
    loginAttempts.delete(ip);
    req.session.authenticated = true;
    return res.json({ success: true });
  } else {
    attemptData.count++;
    loginAttempts.set(ip, attemptData);
    
    const remaining = RATE_LIMIT.maxAttempts - attemptData.count;
    return res.status(401).json({ 
      success: false, 
      message: `Invalid PIN (${remaining} left)`, 
      attemptsRemaining: remaining 
    });
  }
};

router.post('/', handleLogin);
router.post('/login', handleLogin);

router.get('/check', (req, res) => {
  res.json({ authenticated: !!req.session?.authenticated });
});

router.get('/status', (req, res) => {
  res.json({ authenticated: !!req.session?.authenticated });
});

router.post('/logout', (req, res) => {
  req.session = null;
  res.json({ success: true });
});

module.exports = router;
