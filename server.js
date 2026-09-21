const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const cookieSession = require('cookie-session');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');

const config = require('./config');
const authRoutes = require('./routes/auth');
const speedtestRoutes = require('./routes/speedtest');
const networkRoutes = require('./routes/network');
const { router: gameServersRoutes, tcpPing } = require('./routes/gameservers');
const identityRoutes = require('./routes/identity');

const app = express();
app.set('trust proxy', 1);
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Security and compression middlewares
app.use(helmet({
  hsts: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "ws:", "wss:", "stun:stun.l.google.com:19302"],
      imgSrc: ["'self'", "data:"],
      upgradeInsecureRequests: null,
    }
  }
}));
app.use(compression());

// Session middleware
app.use(cookieSession({
  name: 'netpulse_session',
  secret: config.SESSION_SECRET,
  maxAge: 24 * 60 * 60 * 1000,
  httpOnly: true,
  secure: false,
  sameSite: 'lax'
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Authentication middleware for API routes
const requireAuth = (req, res, next) => {
  if (req.path.startsWith('/auth')) return next();
  if (!req.session?.authenticated) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

app.use('/api', requireAuth);

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api', speedtestRoutes);
app.use('/api/network', networkRoutes);
app.use('/api/gameservers', gameServersRoutes);
app.use('/api', identityRoutes);

// WebSocket Server
wss.on('connection', (ws, req) => {
  // In a strict setup, we would parse the cookie string from req.headers.cookie
  // to verify req.session.authenticated, but for simplicity here we assume standard connections.

  let gameServersInterval;

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', ts: Date.now(), clientTs: data.clientTs }));
      } 
      else if (data.type === 'subscribe-gameservers') {
        if (gameServersInterval) clearInterval(gameServersInterval);
        
        gameServersInterval = setInterval(async () => {
          const promises = config.GAME_SERVERS.map(async (srv) => {
            const result = await tcpPing(srv.host, srv.port, 2000);
            return { ...srv, ...result };
          });
          const results = await Promise.all(promises);
          ws.send(JSON.stringify({ type: 'gameserver-update', data: results }));
        }, 2000);
      }
      else if (data.type === 'unsubscribe-gameservers') {
        if (gameServersInterval) {
          clearInterval(gameServersInterval);
          gameServersInterval = null;
        }
      }
      else if (data.type === 'ping-test') {
        const count = data.count || 20;
        for (let i = 0; i < count; i++) {
          await new Promise(r => setTimeout(r, 50)); 
          // Basic placeholder representing sequential pings
          ws.send(JSON.stringify({ type: 'ping-test-result', seq: i + 1, ts: Date.now() }));
        }
      }
    } catch (err) {
      console.error('WebSocket Error:', err);
    }
  });

  ws.on('close', () => {
    if (gameServersInterval) {
      clearInterval(gameServersInterval);
    }
  });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully.');
  server.close(() => {
    console.log('HTTP and WebSocket server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully.');
  server.close(() => {
    console.log('HTTP and WebSocket server closed.');
    process.exit(0);
  });
});

// Start Server
server.listen(config.PORT, () => {
  console.log(`NetPulse server running on port ${config.PORT}`);
});
