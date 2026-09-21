#!/usr/bin/env bash
# ==============================================================================
# NetPulse Quick Update Script
# Updates code in /opt/netpulse and restarts the daemon
# ==============================================================================

set -euo pipefail

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}[INFO] Starting NetPulse update procedure...${NC}"

# Check Root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}[ERROR] This script must be run as root or with sudo privileges.${NC}"
   exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
TARGET_DIR="/opt/netpulse"

# 1. Stop service
echo -e "${BLUE}[INFO] Stopping netpulse service...${NC}"
systemctl stop netpulse || true

# 2. Copy updated files preserving node_modules
echo -e "${BLUE}[INFO] Syncing files from ${SOURCE_DIR} to ${TARGET_DIR}...${NC}"
if command -v rsync &>/dev/null; then
    rsync -av --exclude='node_modules' --exclude='.git' "${SOURCE_DIR}/" "${TARGET_DIR}/"
else
    cp -R "${SOURCE_DIR}"/* "${TARGET_DIR}/" 2>/dev/null || true
fi

# 3. NPM install production dependencies
echo -e "${BLUE}[INFO] Checking npm dependencies in ${TARGET_DIR}...${NC}"
cd "${TARGET_DIR}"
if [[ -f "package.json" ]]; then
    npm install --production --silent
fi

# Update service file if modified
if [[ -f "${TARGET_DIR}/deploy/netpulse.service" ]]; then
    cp "${TARGET_DIR}/deploy/netpulse.service" /etc/systemd/system/netpulse.service
    systemctl daemon-reload
fi

# Update nginx config if modified
if [[ -f "${TARGET_DIR}/deploy/nginx-netpulse.conf" ]]; then
    cp "${TARGET_DIR}/deploy/nginx-netpulse.conf" /etc/nginx/sites-available/netpulse.conf
    nginx -t && systemctl reload nginx
fi

# 4. Restart service
echo -e "${BLUE}[INFO] Restarting netpulse service...${NC}"
systemctl restart netpulse
sleep 2

# 5. Show status
echo -e "${GREEN}[SUCCESS] NetPulse updated and restarted successfully!${NC}\n"
systemctl status netpulse --no-pager
