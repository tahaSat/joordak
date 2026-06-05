#!/usr/bin/env bash
# Run on the server (as a user with sudo) after DNS points joordak.site → this server.
set -euo pipefail

DOMAIN="joordak.site"
WWW="www.joordak.site"
APP_ROOT="/var/www/joordak"
NGINX_AVAILABLE="/etc/nginx/sites-available/joordak.site"
NGINX_ENABLED="/etc/nginx/sites-enabled/joordak.site"
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> Checking DNS..."
if ! getent hosts "$DOMAIN" >/dev/null; then
    echo "Warning: $DOMAIN does not resolve yet. Point A records to this server before continuing."
fi

echo "==> Installing HTTP-only nginx config (cert bootstrap)..."
sudo cp "$REPO_DIR/deploy/joordak.site.nginx.http-only.conf" "$NGINX_AVAILABLE"
sudo ln -sf "$NGINX_AVAILABLE" "$NGINX_ENABLED"
sudo nginx -t
sudo systemctl reload nginx

echo "==> Requesting Let's Encrypt certificate..."
if command -v certbot >/dev/null 2>&1; then
    sudo certbot certonly --nginx \
        -d "$DOMAIN" \
        -d "$WWW" \
        --non-interactive \
        --agree-tos \
        --register-unsafely-without-email \
        || sudo certbot certonly --nginx -d "$DOMAIN" -d "$WWW"
else
    echo "certbot not found. Install: sudo apt install certbot python3-certbot-nginx"
    exit 1
fi

echo "==> Installing production HTTPS nginx config..."
sudo cp "$REPO_DIR/deploy/joordak.site.nginx.conf" "$NGINX_AVAILABLE"
sudo nginx -t
sudo systemctl reload nginx

echo "==> Testing renewal dry-run..."
sudo certbot renew --dry-run

echo ""
echo "Done. Site should be live at https://$DOMAIN"
echo "Renewal is automatic via certbot timer (check: systemctl status certbot.timer)"
