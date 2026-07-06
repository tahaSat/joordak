<?php

namespace App\Console\Commands;

use App\Jobs\CancelStalePendingInvoices;
use Illuminate\Console\Command;

class CancelStalePendingInvoicesCommand extends Command
{
    private const WATCH_INTERVAL_SECONDS = 24 * 60 * 60;

    protected $signature = 'invoices:cancel-stale-pending {--watch : Run continuously, every day}';

    protected $description = 'Cancel pending or processing-payment invoices older than 8 hours';

    public function handle(CancelStalePendingInvoices $job): int
    {
        do {
            $cancelled = $job->handle();

            if ($cancelled > 0) {
                $this->info("Cancelled {$cancelled} stale invoice(s) at ".now()->toDateTimeString());
            } else {
                $this->info('No stale invoices to cancel at '.now()->toDateTimeString());
            }

            if (! $this->option('watch')) {
                break;
            }

            $this->info('Next run in 1 day.');
            sleep(self::WATCH_INTERVAL_SECONDS);
        } while (true);

        return self::SUCCESS;
    }
}
