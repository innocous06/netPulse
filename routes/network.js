const express = require('express');
const { exec } = require('child_process');
const dns = require('dns');
const { promisify } = require('util');
const router = express.Router();

const execAsync = promisify(exec);
const resolve4Async = promisify(dns.resolve4);

const isValidHost = (host) => {
  return typeof host === 'string' && host.length > 0 && host.length <= 255 && !host.startsWith('-') && /^[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?$/.test(host);
};

router.get('/ping/:host', async (req, res) => {
  const { host } = req.params;
  if (!isValidHost(host)) return res.status(400).json({ error: 'Invalid host' });
  
  try {
    const isWin = process.platform === 'win32';
    const cmd = isWin ? `ping -n 4 ${host}` : `ping -c 4 ${host}`;
    const { stdout } = await execAsync(cmd);
    
    let min = null, avg = null, max = null, mdev = null;
    
    if (isWin) {
      const match = stdout.match(/Minimum = (\d+)ms, Maximum = (\d+)ms, Average = (\d+)ms/);
      if (match) {
        min = parseFloat(match[1]); max = parseFloat(match[2]); avg = parseFloat(match[3]); mdev = 0;
      }
    } else {
      const match = stdout.match(/min\/avg\/max\/(?:mdev|stddev) = ([\d.]+)\/([\d.]+)\/([\d.]+)\/([\d.]+)/);
      if (match) {
        min = parseFloat(match[1]); avg = parseFloat(match[2]); max = parseFloat(match[3]); mdev = parseFloat(match[4]);
      }
    }
    
    res.json({ success: true, min, avg, max, mdev, raw: stdout });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Ping failed', raw: error.stdout || error.message });
  }
});

router.get('/traceroute/:host', async (req, res) => {
  const { host } = req.params;
  if (!isValidHost(host)) return res.status(400).json({ error: 'Invalid host' });
  
  try {
    const isWin = process.platform === 'win32';
    const cmd = isWin ? `tracert -d -w 800 -h 8 ${host}` : `traceroute -n -w 1 -m 8 -q 1 ${host}`;
    
    const { stdout } = await execAsync(cmd, { timeout: 15000 });
    res.json({ success: true, raw: stdout });
  } catch (error) {
    const output = error.stdout || error.stderr || error.message;
    res.json({ success: true, partial: true, raw: output });
  }
});

router.get('/dns-resolve', async (req, res) => {
  const domains = ['google.com', 'cloudflare.com', 'amazon.com'];
  const results = {};
  
  for (const domain of domains) {
    const start = performance.now();
    try {
      const addresses = await resolve4Async(domain);
      const timeMs = performance.now() - start;
      results[domain] = { addresses, timeMs: parseFloat(timeMs.toFixed(2)) };
    } catch (error) {
      results[domain] = { error: error.message };
    }
  }
  
  res.json({ success: true, results });
});

router.get('/mtu', async (req, res) => {
  try {
    const isWin = process.platform === 'win32';
    const cmd = isWin ? 'netsh interface ipv4 show subinterfaces' : 'ip link show';
    const { stdout } = await execAsync(cmd);
    res.json({ success: true, raw: stdout });
  } catch (error) {
    res.status(500).json({ success: false, error: 'MTU command failed', raw: error.message });
  }
});

module.exports = router;
