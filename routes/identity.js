const express = require('express');
const geoip = require('geoip-lite');
const crypto = require('crypto');
const router = express.Router();

const http = require('http');

const fetchIpApi = (ip) => {
  return new Promise((resolve) => {
    const queryIp = (ip === '127.0.0.1' || ip === '::1') ? '' : ip;
    const req = http.get(`http://ip-api.com/json/${queryIp}?fields=status,country,countryCode,regionName,city,zip,timezone,isp,org,as,mobile,proxy,hosting,query`, { timeout: 2500 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.status === 'success') resolve(parsed);
          else resolve(null);
        } catch (e) {
          resolve(null);
        }
      });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
};

router.get('/ip-info', async (req, res) => {
  try {
    const forwardedFor = req.headers['x-forwarded-for'];
    const rawIp = forwardedFor ? forwardedFor.split(',')[0].trim() : (req.headers['x-real-ip'] || req.socket.remoteAddress);
    const cleanIp = rawIp.replace(/^::ffff:/, '');
    const isIpv6 = cleanIp.includes(':');

    const apiData = await fetchIpApi(cleanIp);
    const geo = geoip.lookup(cleanIp);

    const clientIp = apiData?.query || cleanIp;
    const isClientIpv6 = clientIp.includes(':');

    res.json({
      success: true,
      ip: clientIp,
      ipv4: !isClientIpv6 ? clientIp : null,
      ipv6: isClientIpv6 ? clientIp : null,
      country: apiData?.country || geo?.country || 'Unknown',
      countryCode: apiData?.countryCode || geo?.country || '',
      city: apiData?.city || geo?.city || 'Unknown',
      region: apiData?.regionName || geo?.region || 'Unknown',
      timezone: apiData?.timezone || geo?.timezone || 'Unknown',
      isp: apiData?.isp || apiData?.org || 'Unknown ISP',
      asn: apiData?.as || 'Unknown ASN',
      org: apiData?.org || 'Unknown',
      isVpn: apiData?.proxy || apiData?.hosting || false
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to lookup IP information' });
  }
});

router.get('/dns-leak-test', (req, res) => {
  const testId = crypto.randomBytes(8).toString('hex');
  res.json({
    success: true,
    testId,
    instructions: `Make multiple requests to <id>.leaktest.domain.com from frontend, then query backend to see detected resolvers. (Mocked implementation)`
  });
});

router.get('/connection-info', (req, res) => {
  const tlsSocket = req.socket.encrypted ? req.socket : null;
  res.json({
    success: true,
    protocol: req.protocol,
    httpVersion: req.httpVersion,
    tls: tlsSocket ? {
      protocol: tlsSocket.getProtocol(),
      cipher: tlsSocket.getCipher()
    } : null
  });
});

module.exports = router;
