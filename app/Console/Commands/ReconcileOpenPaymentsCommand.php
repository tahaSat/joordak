<?php

namespace App\Console\Commands;

use App\Jobs\ReconcileOpenPayments;
use App\Services\PaymentLifecycleService;
use App\Services\ZibalPaymentService;
use Illuminate\Console\Command;

class ReconcileOpenPaymentsCommand extends Command
{
    protected $signature = 'payments:reconcile-open';

    protected $description = 'Verify stale open Zibal payments, then expire abandoned ones after 30 minutes';

    public function handle(ReconcileOpenPayments $job, ZibalPaymentService $zibal, PaymentLifecycleService $lifecycle): int
    {
        $result = $job->handle($zibal, $lifecycle);

        $this->info(sprintf(
            'Reconciled open payments: %d verified, %d expired.',
            $result['verified'],
            $result['expired'],
        ));

        return self::SUCCESS;
    }
}
