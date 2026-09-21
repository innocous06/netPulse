#!/usr/bin/env bash
# ==============================================================================
# NetPulse Automated One-Click Setup Script
# Ubuntu 22.04 LTS Deployment
# Target Access URL: http://140.245.227.125:8443
# ==============================================================================

set -euo pipefail

# Visual styling colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Logging helpers
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${CYAN}${BOLD}"
    echo "============================================================"
    echo "         NetPulse Diagnostic Server Setup Script            "
    echo "============================================================"
    echo -e "${NC}"
}

print_header

# 1. Check Root Privileges
log_info "Step 1/12: Verifying execution privileges..."
if [[ $EUID -ne 0 ]]; then
   log_error "This script must be run as root or with sudo privileges."
   exit 1
fi
log_success "Root privileges confirmed."

# Determine directory paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
TARGET_DIR="/opt/netpulse"

log_info "Source directory: ${SOURCE_DIR}"
log_info "Installation directory: ${TARGET_DIR}"

# 2. Update System Packages
log_info "Step 2/12: Updating package index..."
apt-get update -qq || { log_error "Failed to update apt package index."; exit 1; }
log_success "Package index updated."

# 3. Install Node.js 20 LTS
log_info "Step 3/12: Checking and installing Node.js 20 LTS..."
if ! command -v node &>/dev/null || [[ $(node -v | cut -d. -f1 | tr -d 'v') -lt 20 ]]; then
    log_info "Configuring NodeSource repository for Node.js 20.x..."
    apt-get install -y -qq curl ca-certificates gnupg
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg --yes
    NODE_MAJOR=20
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list
    apt-get update -qq
    apt-get install -y -qq nodejs
    log_success "Node.js installed: $(node -v)"
else
    log_success "Node.js $(node -v) is already installed."
fi

# 4. Install Diagnostic & Web Dependencies
log_info "Step 4/12: Installing Nginx and system diagnostic utilities (fping, traceroute, iputils-ping, dnsutils)..."
apt-get install -y -qq nginx fping traceroute iputils-ping dnsutils build-essential || {
    log_error "Failed to install required system packages."
    exit 1
}
log_success "System tools and Nginx installed."

# 5. Prepare Target Installation Directory
log_info "Step 5/12: Setting up application directory at ${TARGET_DIR}..."
mkdir -p "${TARGET_DIR}"

# 6. Copy NetPulse Files
log_info "Step 6/12: Copying NetPulse application files to ${TARGET_DIR}..."
if command -v rsync &>/dev/null; then
    rsync -av --exclude='node_modules' --exclude='.git' "${SOURCE_DIR}/" "${TARGET_DIR}/"
else
    cp -R "${SOURCE_DIR}"/* "${TARGET_DIR}/" 2>/dev/null || true
    rm -rf "${TARGET_DIR}/node_modules"
fi
log_success "Files copied to ${TARGET_DIR}."

# 7. Install NPM Production Dependencies
log_info "Step 7/12: Installing Node.js production dependencies..."
cd "${TARGET_DIR}"
if [[ -f "package.json" ]]; then
    npm install --production --silent || { log_error "NPM installation failed."; exit 1; }
    log_success "NPM packages installed."
else
    log_warn "No package.json found in ${TARGET_DIR}. Skipping npm install."
fi

# 8. Configure Systemd Service
log_info "Step 8/12: Configuring systemd service unit..."
if [[ -f "${TARGET_DIR}/deploy/netpulse.service" ]]; then
    cp "${TARGET_DIR}/deploy/netpulse.service" /etc/systemd/system/netpulse.service
    chmod 644 /etc/systemd/system/netpulse.service
    log_success "Systemd service copied to /etc/systemd/system/netpulse.service."
else
    log_error "netpulse.service missing from ${TARGET_DIR}/deploy/."
    exit 1
fi

# 9. Configure Nginx Proxy
log_info "Step 9/12: Setting up Nginx reverse proxy configuration..."
if [[ -f "${TARGET_DIR}/deploy/nginx-netpulse.conf" ]]; then
    cp "${TARGET_DIR}/deploy/nginx-netpulse.conf" /etc/nginx/sites-available/netpulse.conf
    ln -sf /etc/nginx/sites-available/netpulse.conf /etc/nginx/sites-enabled/netpulse.conf
    log_success "Nginx site configuration linked."
else
    log_error "nginx-netpulse.conf missing from ${TARGET_DIR}/deploy/."
    exit 1
fi

# 10. Firewall Configuration
log_info "Step 10/12: Checking Firewall (UFW) rules for port 8443..."
if command -v ufw &>/dev/null && ufw status | grep -q "Status: active"; then
    log_info "UFW is active. Allowing TCP port 8443..."
    ufw allow 8443/tcp
    log_success "Port 8443 opened in UFW."
else
    log_info "UFW is inactive or not installed. Ensure port 8443 is open in your cloud VPS security group."
fi

# 11. Start NetPulse Daemon
log_info "Step 11/12: Reloading systemd and launching NetPulse service..."
systemctl daemon-reload
systemctl enable netpulse
systemctl restart netpulse
sleep 2

if systemctl is-active --quiet netpulse; then
    log_success "NetPulse systemd service is active and running."
else
    log_error "NetPulse service failed to start. Run 'journalctl -u netpulse -e' for logs."
    exit 1
fi

# 12. Validate & Reload Nginx
log_info "Step 12/12: Testing Nginx syntax and reloading server..."
nginx -t || { log_error "Nginx configuration syntax test failed."; exit 1; }
systemctl reload nginx
log_success "Nginx reloaded successfully."

# Completion Announcement
echo -e "\n${GREEN}${BOLD}============================================================"
echo "          NetPulse Setup Completed Successfully!            "
echo -e "============================================================${NC}\n"

echo -e "Access URL:          ${CYAN}${BOLD}http://140.245.227.125:8443${NC}"
echo -e "Default Access PIN:  ${YELLOW}${BOLD}060606${NC}"
echo -e "Service Status:      ${GREEN}Active (Running)${NC}"
echo -e "Install Directory:   /opt/netpulse"
echo -e "Log Commands:        journalctl -u netpulse -f"
echo -e "                     tail -f /var/log/nginx/netpulse.access.log"

echo -e "\n${RED}${BOLD}[IMPORTANT ACTION REQUIRED]${NC}"
echo -e "${YELLOW}Please change the default PIN in ${BOLD}/etc/systemd/system/netpulse.service${NC}"
echo -e "${YELLOW}Update ${BOLD}Environment=NETPULSE_PIN=your_custom_pin${NC} and then run:"
echo -e "${CYAN}  sudo systemctl daemon-reload && sudo systemctl restart netpulse${NC}\n"
