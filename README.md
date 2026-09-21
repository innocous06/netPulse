# netPulse

[![Status: Production](https://img.shields.io/badge/STATUS-PRODUCTION-18181f?style=for-the-badge)](https://github.com/innocous06/netPulse)
[![Language: JavaScript](https://img.shields.io/badge/LANGUAGE-NODE.JS_20+-18181f?style=for-the-badge)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/LICENSE-MIT-18181f?style=for-the-badge)](LICENSE)

A self-hosted, personal network diagnostics and telemetry workstation built with Node.js, Express, WebSockets, and an Editorial Utility user interface.

## Overview

NetPulse provides real-time network health metrics, multi-stream bandwidth measurements, and low-overhead server telemetry without relying on third-party ad-heavy speed tests. It is deployed as a systemd service on Ubuntu alongside reverse proxies like Nginx and tunnel daemons without port conflicts.

All protected diagnostic APIs are guarded behind a personal PIN authentication gate with IP-based rate limiting to prevent brute-force exposure on public servers.

## Highlights & Capabilities

- **Editorial Utility UI**: Monochromatic high-contrast interface with under 10% sky-blue telemetry accents. Zero visual clutter.
- **Precision Speedtest Engine**: Windowed bandwidth sampling (1500 ms sliding window) that discards initial TCP slow-start ramp-up for sustained throughput accuracy.
- **Threading Modes & Stop Control**: Toggle between Multi-Stream (parallel worker threads), Single-Stream, or Sequential passes with instant abort signal support.
- **Game Server Probing**: Real-time TCP latency probes to official gaming clusters across Mumbai, Singapore, Tokyo, Frankfurt, and US regions (Valorant, CS2, Apex Legends, Fortnite, Dota 2).
- **Network Diagnostics**: In-depth inspection covering public IP identity, ISP, ASN, reverse DNS resolution, path MTU discovery, and ICMP traceroute fallback for cloud VPC firewalls.
- **Hardened Security**: Strict 5-attempt / 15-minute brute-force lockout, client IP header resolution, input sanitation against shell metacharacters, and streaming flood guards.

## Tech Stack

- **Backend Runtime:** Node.js 20+ LTS
- **Server Framework:** Express 4 (`helmet`, `compression`, `cookie-session`)
- **Real-Time Layer:** `ws` (WebSocket Server)
- **Geolocation & IP:** `geoip-lite` 2.0.3 (Zero vulnerabilities)
- **Frontend Architecture:** Semantic HTML5, Vanilla ES6+, CSS Custom Properties
- **Production Host:** Ubuntu 22.04 LTS (Oracle Cloud Infrastructure)
- **Daemon & Reverse Proxy:** Systemd (`netpulse.service`), Nginx (Port 8443)

## Getting Started

### Local Development

```bash
# Clone the repository
git clone https://github.com/innocous06/netPulse.git
cd netPulse

# Install dependencies
npm install

# Start server (defaults to port 3001 locally)
node server.js
```

Open `http://localhost:3001` in your browser. Default PIN: `060606`.

### Environment Configuration

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `PORT` | `3000` (Linux) / `3001` (Windows) | Listening port for the HTTP/WS server |
| `NETPULSE_PIN` | `060606` | Administrative access PIN |
| `SESSION_SECRET` | Auto-generated 32-byte hex | Session cookie signing secret |
| `NODE_ENV` | `production` | Production mode switch |

## VPS Deployment

To deploy or update on an Ubuntu 22.04 LTS VPS:

```bash
# 1. Sync updated files to VPS
scp -r * user@YOUR_SERVER_IP:/opt/netpulse/

# 2. Restart systemd daemon
ssh user@YOUR_SERVER_IP "cd /opt/netpulse && npm install --production && sudo systemctl restart netpulse"

# 3. Check live service status
ssh user@YOUR_SERVER_IP "sudo systemctl status netpulse --no-pager"
```

## Security & Rate Limiting

- **Brute-Force Guard**: 5 maximum failed login attempts per IP address within a 15-minute rolling window. Further attempts are blocked with HTTP 429.
- **Reverse Proxy Header Parsing**: Extracts the initial IP from `X-Forwarded-For` to prevent header spoofing when running behind cloud load balancers.
- **Command Injection Prevention**: Target hosts in ping, traceroute, and DNS resolution are restricted to strict alphanumeric domain and IP patterns.

## License

Released under the [MIT License](LICENSE).

Copyright (c) 2026 innocous06. All rights reserved.
