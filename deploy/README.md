# NetPulse Deployment Guide 🚀

NetPulse is an ultra-lightweight, high-performance personal network diagnostics tool built with Node.js, Express, WebSockets, and Nginx. This guide outlines how to deploy NetPulse on an Ubuntu 22.04 LTS VPS alongside services like Xray.

---

## 📌 Server Details

- **Target Server IP:** `140.245.227.125`
- **Public Port:** `8443`
- **Access URL:** `http://140.245.227.125:8443`
- **Internal Service Port:** `3000` (Node.js Express + WebSocket server)

---

## 📋 Prerequisites

- **OS:** Ubuntu 22.04 LTS (1 vCPU, 1 GB RAM minimum)
- **Privileges:** `root` or `sudo` access
- **Network:** Port `8443/tcp` opened in VPS firewall / cloud security groups
- **Tools installed by setup:** Node.js 20 LTS, Nginx, `fping`, `traceroute`, `iputils-ping`, `dnsutils`

---

## ⚡ Quick Start Deployment

Upload or clone the `netpulse-server` repository to your server and run the automated setup script:

```bash
cd /path/to/netpulse-server/deploy
chmod +x setup.sh update.sh
sudo ./setup.sh
```

### What `setup.sh` Automated Steps Perform:
1. Verifies root execution rights.
2. Updates `apt` package lists and configures NodeSource Node.js 20 LTS repository.
3. Installs Node.js, Nginx, `fping`, `traceroute`, `ping`, and `dig` (`dnsutils`).
4. Creates application directory `/opt/netpulse` and copies project files.
5. Installs Node.js production dependencies (`npm install --production`).
6. Deploys systemd service unit `/etc/systemd/system/netpulse.service`.
7. Configures Nginx reverse proxy on port 8443 with WebSocket support and rate limiting.
8. Opens firewall port 8443 in UFW if enabled.
9. Starts and enables the `netpulse` service.
10. Validates Nginx configuration and reloads Nginx.

---

## ⚙️ Configuration & Environment Variables

Environment variables are configured in `/etc/systemd/system/netpulse.service`:

```ini
[Service]
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=NETPULSE_PIN=060606
```

### Changing the PIN Code
1. Edit the service configuration:
   ```bash
   sudo nano /etc/systemd/system/netpulse.service
   ```
2. Update the `NETPULSE_PIN` value:
   ```ini
   Environment=NETPULSE_PIN=your_secret_pin
   ```
3. Reload systemd and restart NetPulse:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl restart netpulse
   ```

---

## 🛡️ Coexistence with Xray (Port 443 + Port 8443)

If Xray is running on port 443 (VLESS/VMess/Trojan with TLS/REALITY), NetPulse runs on port 8443 without port conflicts.

### Architecture Overview:
```
[Client Web Browser] ---> Port 8443 (Nginx Reverse Proxy) ---> Port 3000 (NetPulse Node.js Server)
[VPN Client Traffic]  ---> Port 443  (Xray Core Service)
```

---

## 🔐 Optional: Routing NetPulse Through Xray's Fallback (TLS via 443)

If you wish to serve NetPulse over HTTPS on port 443 behind Xray's SNI fallback mechanism:

1. Open your Xray configuration file (e.g. `/usr/local/etc/xray/config.json`).
2. Add or update the `fallbacks` array inside your `inbounds` section:

```json
{
  "inbounds": [
    {
      "port": 443,
      "protocol": "vless",
      "settings": {
        "clients": [...],
        "decryption": "none",
        "fallbacks": [
          {
            "dest": "3000",
            "xver": 0
          },
          {
            "path": "/ws",
            "dest": "3000",
            "xver": 0
          }
        ]
      },
      "streamSettings": {
        "network": "tcp",
        "security": "tls",
        "tlsSettings": {
          "certificates": [...]
        }
      }
    }
  ]
}
```

3. Restart Xray:
   ```bash
   sudo systemctl restart xray
   ```

Now HTTPS traffic on port 443 with normal browser requests fallback directly to NetPulse on port 3000 while VPN traffic is processed by Xray.

---

## 🔄 Updating NetPulse

To pull updates and apply them to the running server:

```bash
cd /path/to/netpulse-server/deploy
sudo ./update.sh
```

`update.sh` will gracefully stop `netpulse`, sync updated source files to `/opt/netpulse` (preserving `node_modules`), run `npm install --production`, refresh configs, restart the daemon, and print real-time status.

---

## 🛠️ Troubleshooting & Diagnostics

### Check NetPulse Daemon Status:
```bash
sudo systemctl status netpulse
```

### View Live Application Logs:
```bash
sudo journalctl -u netpulse -f
```

### View Nginx Logs:
```bash
sudo tail -f /var/log/nginx/netpulse.access.log
sudo tail -f /var/log/nginx/netpulse.error.log
```

### Verify Raw Socket Capabilities:
NetPulse runs under root in `netpulse.service` to allow ICMP ping / traceroute / fping execution. If executing as a non-root user manually, set capabilities:
```bash
sudo setcap cap_net_raw+ep /usr/bin/fping
sudo setcap cap_net_raw+ep $(which node)
```

---

## 🌐 Accessing NetPulse

- **Web Dashboard:** [http://140.245.227.125:8443](http://140.245.227.125:8443)
- **Default PIN:** `060606`
