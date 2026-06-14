#!/usr/bin/env bash
# Pre-migration backup reminder and post-migration verification for production upgrades.
set -euo pipefail

echo "=== Joordak Bluesheep Parity — Migration Safety ==="
echo ""
echo "Before running on production:"
echo "  1. mysqldump -u USER -p joordak > joordak_backup_\$(date +%Y%m%d_%H%M%S).sql"
echo "  2. Test on a staging copy of the production database first"
echo ""
echo "Run migrations:"
echo "  php artisan migrate --force"
echo ""
echo "Verify sub-product backfill:"
echo "  php artisan joordak:verify-sub-products"
echo ""

php artisan joordak:verify-sub-products
