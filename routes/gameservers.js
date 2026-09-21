const express = require('express');
const net = require('net');
const { GAME_SERVERS } = require('../config');
const router = express.Router();

const tcpPing = (host, port, timeout = 2500) => {
  return new Promise((resolve) => {
    const start = performance.now();
    const socket = new net.Socket();
    
    socket.setTimeout(timeout);
    
    const cleanup = () => {
      socket.destroy();
    };

    socket.on('connect', () => {
      const latency = performance.now() - start;
      cleanup();
      resolve({ alive: true, latency: Math.max(1, parseFloat(latency.toFixed(1))) });
    });
    
    socket.on('timeout', () => {
      cleanup();
      resolve({ alive: false, latency: null, error: 'timeout' });
    });
    
    socket.on('error', (err) => {
      const latency = performance.now() - start;
      cleanup();
      // ECONNREFUSED means the host actively responded with a TCP RST! Host is alive.
      if (err.code === 'ECONNREFUSED') {
        return resolve({ alive: true, latency: Math.max(1, parseFloat(latency.toFixed(1))) });
      }
      resolve({ alive: false, latency: null, error: err.code || err.message });
    });
    
    socket.connect(port, host);
  });
};

router.get('/', async (req, res) => {
  try {
    const promises = GAME_SERVERS.map(async (server) => {
      const result = await tcpPing(server.host, server.port);
      return { ...server, ...result };
    });
    
    const results = await Promise.allSettled(promises);
    
    const formattedResults = results.map(r => r.status === 'fulfilled' ? r.value : { error: 'probe failed' });
    
    const grouped = formattedResults.reduce((acc, server) => {
      if (!server.game) return acc; // Skip failed mappings if any
      if (!acc[server.game]) acc[server.game] = [];
      acc[server.game].push(server);
      return acc;
    }, {});
    
    res.json({ success: true, games: grouped });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to probe game servers' });
  }
});

module.exports = { router, tcpPing };
