# Joordak Production Cutover Checklist

After deploying the Bluesheep parity upgrade to production:

## Pre-deploy

1. **Backup database**
   ```bash
   mysqldump -u USER -p joordak > joordak_backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Test on staging** — restore production dump to staging, run migrations, smoke-test checkout.

## Deploy

```bash
git pull
composer install --no-dev --optimize-autoloader
npm ci && npm run build
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:clear
php artisan joordak:verify-sub-products
```

## Environment variables (add to `.env`)

```env
ZIBAL_MERCHANT=your-joordak-merchant-id
ZIBAL_BASE_URL=https://gateway.zibal.ir
ZIBAL_START_URL=https://gateway.zibal.ir/start
ZIBAL_CALLBACK_URL="${APP_URL}/payments/zibal/callback"
ZIBAL_TIMEOUT=15
SMS_DELIVERED_TO_POST_TEMPLATE_ID=your-template-id
```

## Queue worker (required)

Image uploads and Zibal payment reconciliation run on the queue:

```bash
php artisan queue:listen --tries=3 --timeout=120
```

Or configure a systemd/supervisor service for production.

## Scheduler (required)

Add to crontab:

```cron
* * * * * cd /path/to/joordak && php artisan schedule:run >> /dev/null 2>&1
```

This runs Zibal reconciliation every 5 minutes for stuck payments.

## Post-deploy verification

- [ ] Admin panel at `/admin` loads (Inertia, not Filament)
- [ ] Products show variants (sub-products) on product detail page
- [ ] Cart coupon codes work
- [ ] Checkout creates invoice with shipping cost
- [ ] Zibal payment flow completes end-to-end
- [ ] `php artisan joordak:verify-sub-products` passes
- [ ] Queue worker is running
- [ ] Existing products have default sub-product rows

## Rollback

If issues occur, restore the database backup and redeploy the previous release artifact.
