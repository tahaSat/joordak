#!/usr/bin/env bash
# Run on the server (as a user with sudo) after DNS points joordak.shop → this server.
set -euo pipefail

DOMAIN="joordak.shop"
WWW="www.joordak.shop"
NGINX_AVAILABLE="/etc/nginx/sites-available/joordak.shop"
NGINX_ENABLED="/etc/nginx/sites-enabled/joordak.shop"
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DNS_RESOLVER="${DNS_RESOLVER:-8.8.8.8}"

check_public_dns() {
    local name="$1"
    local result

    if ! command -v dig >/dev/null 2>&1; then
        echo "Warning: dig not installed; skipping strict DNS check."
        return 0
    fi

    result="$(dig @"$DNS_RESOLVER" +short "$name" A 2>/dev/null | head -n1 || true)"
    if [[ -z "$result" ]]; then
        echo "ERROR: $name has no public A record (NXDOMAIN or not propagated)."
        echo "       Checked via: dig @$DNS_RESOLVER $name A"
        return 1
    fi

    echo "OK: $name -> $result"
    return 0
}

echo "==> Checking public DNS (Let's Encrypt uses the same public DNS)..."
SERVER_IP="$(curl -4 -s ifconfig.me || curl -4 -s icanhazip.com || true)"
if [[ -n "$SERVER_IP" ]]; then
    echo "    This server's public IPv4: $SERVER_IP"
fi

DNS_OK=1
check_public_dns "$DOMAIN" || DNS_OK=0
check_public_dns "$WWW" || DNS_OK=0

if [[ "$DNS_OK" -ne 1 ]]; then
    echo ""
    echo "Cannot request SSL until both names resolve publicly."
    echo ""
    echo "Fix at your domain registrar / DNS panel:"
    echo "  A     @      -> $SERVER_IP"
    echo "  A     www    -> $SERVER_IP"
    echo ""
    echo "Then verify from the server:"
    echo "  dig @$DNS_RESOLVER $DOMAIN A +short"
    echo "  dig @$DNS_RESOLVER $WWW A +short"
    echo ""
    echo "When both return your server IP, re-run:"
    echo "  sudo bash deploy/setup-ssl.sh"
    exit 1
fi

echo "==> Installing HTTP-only nginx config (cert bootstrap)..."
sudo cp "$REPO_DIR/deploy/joordak.shop.nginx.http-only.conf" "$NGINX_AVAILABLE"
sudo ln -sf "$NGINX_AVAILABLE" "$NGINX_ENABLED"
sudo nginx -t
sudo systemctl reload nginx

echo "==> Requesting Let's Encrypt certificate..."
if ! command -v certbot >/dev/null 2>&1; then
    echo "certbot not found. Install: sudo apt install certbot python3-certbot-nginx"
    exit 1
fi

CERTBOT_EMAIL="${CERTBOT_EMAIL:-}"
CERTBOT_ARGS=(certonly --nginx -d "$DOMAIN" -d "$WWW" --non-interactive --agree-tos)
if [[ -n "$CERTBOT_EMAIL" ]]; then
    CERTBOT_ARGS+=(--email "$CERTBOT_EMAIL")
else
    CERTBOT_ARGS+=(--register-unsafely-without-email)
fi

sudo certbot "${CERTBOT_ARGS[@]}"

echo "==> Installing production HTTPS nginx config..."
sudo cp "$REPO_DIR/deploy/joordak.shop.nginx.conf" "$NGINX_AVAILABLE"
sudo nginx -t
sudo systemctl reload nginx

echo "==> Testing renewal dry-run..."
sudo certbot renew --dry-run

echo ""
echo "Done. Site should be live at https://$DOMAIN"
echo "Renewal is automatic via certbot timer (check: systemctl status certbot.timer)"
