<?php

namespace App\Jobs;

use App\Enums\PaymentStatus;
use App\Models\Payment;
use App\Services\PaymentLifecycleService;
use App\Services\ZibalPaymentService;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

class ReconcileOpenPayments
{
    use Queueable;

    private const EXPIRE_AFTER_MINUTES = 30;

    /**
     * @return array{verified: int, expired: int}
     */
    public function handle(ZibalPaymentService $zibal, PaymentLifecycleService $lifecycle): array
    {
        $cutoff = now()->subMinutes(self::EXPIRE_AFTER_MINUTES);
        $verified = 0;
        $expired = 0;

        Payment::query()
            ->whereIn('status', [
                PaymentStatus::Pending->value,
                PaymentStatus::Processing->value,
            ])
            ->where(function ($query) use ($cutoff): void {
                $query->where(function ($inner) use ($cutoff): void {
                    $inner->whereNotNull('requested_at')
                        ->where('requested_at', '<=', $cutoff);
                })->orWhere(function ($inner) use ($cutoff): void {
                    $inner->whereNull('requested_at')
                        ->where('created_at', '<=', $cutoff);
                });
            })
            ->orderBy('id')
            ->chunkById(100, function ($payments) use ($zibal, $lifecycle, &$verified, &$expired): void {
                foreach ($payments as $payment) {
                    $result = $this->reconcilePayment($payment, $zibal, $lifecycle);

                    if ($result === 'verified') {
                        $verified++;
                    } elseif ($result === 'expired') {
                        $expired++;
                    }
                }
            });

        return [
            'verified' => $verified,
            'expired' => $expired,
        ];
    }

    private function reconcilePayment(
        Payment $payment,
        ZibalPaymentService $zibal,
        PaymentLifecycleService $lifecycle,
    ): ?string {
        $payment->refresh();

        if (! in_array($payment->status, [PaymentStatus::Pending, PaymentStatus::Processing], true)) {
            return null;
        }

        if (filled($payment->gateway_track_id)) {
            try {
                $verify = $zibal->verify((string) $payment->gateway_track_id);

                if ($zibal->isSuccessfulVerification($verify) && $zibal->amountMatches($payment, $verify)) {
                    $lifecycle->markPaid($payment, $verify);

                    Log::info('ReconcileOpenPayments verified payment', [
                        'payment_id' => $payment->id,
                        'invoice_id' => $payment->invoice_id,
                        'track_id' => $payment->gateway_track_id,
                    ]);

                    return 'verified';
                }

                $lifecycle->markExpired(
                    $payment,
                    $verify['message'] ?? 'Payment session expired after unsuccessful verification.',
                    $verify,
                );

                return 'expired';
            } catch (Throwable $exception) {
                report($exception);

                $lifecycle->markExpired(
                    $payment,
                    'Payment session expired after verification error: '.$exception->getMessage(),
                );

                return 'expired';
            }
        }

        $lifecycle->markExpired($payment, 'Payment session expired before gateway track was created.');

        return 'expired';
    }
}
