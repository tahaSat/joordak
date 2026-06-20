<?php

namespace App\Jobs;

use App\Enums\InvoiceStatus;
use App\Enums\PaymentStatus;
use App\Models\Invoice;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;

class CancelStalePendingInvoices
{
    use Queueable;

    private const STALE_AFTER_HOURS = 24;

    public function handle(): int
    {
        $cutoff = now()->subHours(self::STALE_AFTER_HOURS);
        $cancelled = 0;

        Invoice::query()
            ->whereIn('status', [
                InvoiceStatus::PendingPayment,
                InvoiceStatus::ProcessingPayment,
            ])
            ->where('created_at', '<=', $cutoff)
            ->orderBy('id')
            ->chunkById(100, function ($invoices) use (&$cancelled): void {
                foreach ($invoices as $invoice) {
                    $didCancel = DB::transaction(function () use ($invoice): bool {
                        $locked = Invoice::query()->lockForUpdate()->find($invoice->id);

                        if (! $locked || ! in_array($locked->status, [
                            InvoiceStatus::PendingPayment,
                            InvoiceStatus::ProcessingPayment,
                        ], true)) {
                            return false;
                        }

                        $locked->forceFill([
                            'status' => InvoiceStatus::Cancelled,
                        ])->save();

                        $locked->payments()
                            ->whereIn('status', [
                                PaymentStatus::Pending->value,
                                PaymentStatus::Processing->value,
                            ])
                            ->update(['status' => PaymentStatus::Cancelled->value]);

                        return true;
                    });

                    if ($didCancel) {
                        $cancelled++;
                    }
                }
            });

        return $cancelled;
    }
}
