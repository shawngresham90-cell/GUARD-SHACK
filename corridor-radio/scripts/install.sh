#!/usr/bin/env bash
#
# install.sh - Deploy Corridor Radio as a systemd service.
#
# Installs the corridor-server binary and web frontend into
# /opt/corridor-radio, registers the systemd unit, then enables and
# starts the service. Run as root:
#
#     sudo ./scripts/install.sh
#
set -euo pipefail

# ------------------------------------------------------------
# Configuration
# ------------------------------------------------------------
INSTALL_DIR="/opt/corridor-radio"
SERVICE_NAME="corridor-radio"
SERVICE_USER="www-data"
SERVICE_GROUP="www-data"
UNIT_DEST="/etc/systemd/system/${SERVICE_NAME}.service"

# Resolve the project root (this script lives in <root>/scripts).
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

BIN_SRC="${PROJECT_ROOT}/corridor-server"
WWW_SRC="${PROJECT_ROOT}/www"
UNIT_SRC="${PROJECT_ROOT}/systemd/${SERVICE_NAME}.service"

log()  { printf '\033[1;33m[corridor-radio]\033[0m %s\n' "$*"; }
die()  { printf '\033[1;31m[corridor-radio] ERROR:\033[0m %s\n' "$*" >&2; exit 1; }

# ------------------------------------------------------------
# Pre-flight checks
# ------------------------------------------------------------
[ "$(id -u)" -eq 0 ] || die "This script must be run as root (try: sudo $0)."

command -v systemctl >/dev/null 2>&1 || die "systemctl not found; this host does not use systemd."

# Build the binary if it hasn't been compiled yet.
if [ ! -f "${BIN_SRC}" ]; then
    log "Binary not found at ${BIN_SRC}; attempting to build it..."
    if command -v make >/dev/null 2>&1; then
        make -C "${PROJECT_ROOT}"
    else
        die "corridor-server binary missing and 'make' is unavailable. Run 'make' first."
    fi
fi
[ -f "${BIN_SRC}" ] || die "corridor-server binary still missing after build."
[ -d "${WWW_SRC}" ] || die "www/ directory not found at ${WWW_SRC}."
[ -f "${UNIT_SRC}" ] || die "systemd unit not found at ${UNIT_SRC}."

# Ensure the service account exists.
if ! id -u "${SERVICE_USER}" >/dev/null 2>&1; then
    die "Service user '${SERVICE_USER}' does not exist. Create it or edit this script."
fi

# ------------------------------------------------------------
# 1. Create the install directory
# ------------------------------------------------------------
log "Creating ${INSTALL_DIR}"
install -d -m 0755 "${INSTALL_DIR}"

# ------------------------------------------------------------
# 2. Copy the binary and the www/ frontend
# ------------------------------------------------------------
log "Installing binary -> ${INSTALL_DIR}/corridor-server"
install -m 0755 "${BIN_SRC}" "${INSTALL_DIR}/corridor-server"

log "Installing web frontend -> ${INSTALL_DIR}/www"
rm -rf "${INSTALL_DIR}/www"
cp -R "${WWW_SRC}" "${INSTALL_DIR}/www"

# ------------------------------------------------------------
# 3. Set ownership and permissions
# ------------------------------------------------------------
log "Setting ownership to ${SERVICE_USER}:${SERVICE_GROUP}"
chown -R "${SERVICE_USER}:${SERVICE_GROUP}" "${INSTALL_DIR}"
chmod 0755 "${INSTALL_DIR}/corridor-server"
find "${INSTALL_DIR}/www" -type d -exec chmod 0755 {} +
find "${INSTALL_DIR}/www" -type f -exec chmod 0644 {} +

# ------------------------------------------------------------
# 4. Install the systemd unit
# ------------------------------------------------------------
log "Installing systemd unit -> ${UNIT_DEST}"
install -m 0644 "${UNIT_SRC}" "${UNIT_DEST}"

log "Reloading systemd daemon"
systemctl daemon-reload

# ------------------------------------------------------------
# 5. Enable and (re)start the service
# ------------------------------------------------------------
log "Enabling and starting ${SERVICE_NAME}"
systemctl enable "${SERVICE_NAME}.service"
systemctl restart "${SERVICE_NAME}.service"

# ------------------------------------------------------------
# Report status
# ------------------------------------------------------------
sleep 1
if systemctl is-active --quiet "${SERVICE_NAME}.service"; then
    log "Service is active. Listening on port 7681."
else
    log "Service did not report active; recent logs:"
    journalctl -u "${SERVICE_NAME}.service" -n 20 --no-pager || true
    die "Service failed to start. See logs above."
fi

log "Done. Useful commands:"
log "  systemctl status ${SERVICE_NAME}"
log "  journalctl -u ${SERVICE_NAME} -f"
