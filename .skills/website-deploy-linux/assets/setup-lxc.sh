#!/usr/bin/env bash
# =============================================================
#  deploy/setup-lxc.sh
#  Run this ONCE on the LXC as root to install Nginx and
#  place the site files in the right location.
# =============================================================
set -euo pipefail

SITE_DIR="/var/www/test-site"
NGINX_CONF="/etc/nginx/sites-available/test-site"
NGINX_LINK="/etc/nginx/sites-enabled/test-site"

echo "==> Installing Nginx..."
apt-get update -qq
apt-get install -y nginx

echo "==> Creating web root..."
mkdir -p "$SITE_DIR"

echo "==> Copying site files..."
# Adjust the source path if needed (wherever you rsync'd dist/ to)
cp -r /tmp/test-site-dist/dist/. "$SITE_DIR/"
chown -R www-data:www-data "$SITE_DIR"
chmod -R 755 "$SITE_DIR"

echo "==> Installing Nginx config..."
cp "$(dirname "$0")/nginx/test-site.conf" "$NGINX_CONF"
ln -sf "$NGINX_CONF" "$NGINX_LINK"

# Remove default site if present
rm -f /etc/nginx/sites-enabled/default

echo "==> Testing Nginx config..."
nginx -t

echo "==> Enabling and starting Nginx..."
systemctl enable nginx
systemctl restart nginx

echo ""
echo "✅ Done! Site is live at http://$(hostname -I | awk '{print $1}')/"
