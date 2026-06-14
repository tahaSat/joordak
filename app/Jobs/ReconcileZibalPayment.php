<?php

namespace App\Jobs;

use App\Models\Payment;
use App\Services\PaymentLifecycleService;
use App\Services\ZibalPaymentService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Throwable;

class ReconcileZibalPayment implements ShouldQueue
{
    use Queueable;

    public int $tries = 5;

    /**
     * Create a new job instance.
     */
    public function __construct(public Payment $payment)
    {
        $this->onQueue('payments');
    }

    /**
     * Execute the job.
     */
    public function handle(ZibalPaymentService $zibal, PaymentLifecycleService $lifecycle): void
    {
        $payment = $this->payment->fresh(['invoice']);

        if (! $payment || ! $payment->isOpen() || blank($payment->gateway_track_id)) {
            return;
        }

        $payment->increment('attempt_count');

        try {
            $inquiry = $zibal->inquiry((string) $payment->gateway_track_id);
            $payment->forceFill([
                'inquiry_payload' => $inquiry,
                'last_checked_at' => now(),
            ])->save();

            if (! $zibal->isPaidInquiry($inquiry)) {
                if ($payment->attempt_count >= 6) {
                    $lifecycle->markFailed($payment, $inquiry['message'] ?? 'Payment was not confirmed by Zibal.', inquiryPayload: $inquiry);
                }

                return;
            }

            if (! $zibal->amountMatches($payment, $inquiry)) {
                $lifecycle->markFailed($payment, 'Zibal inquiry amount does not match invoice amount.', inquiryPayload: $inquiry);

                return;
            }

            $verify = $zibal->verify((string) $payment->gateway_track_id);

            if ($zibal->isSuccessfulVerification($verify) && $zibal->amountMatches($payment, $verify)) {
                $lifecycle->markPaid($payment, $verify, inquiryPayload: $inquiry);

                return;
            }

            $lifecycle->markFailed($payment, $verify['message'] ?? 'Zibal verification failed during reconciliation.', verifyPayload: $verify, inquiryPayload: $inquiry);
        } catch (Throwable $exception) {
            report($exception);
            $this->release(now()->addMinutes(10));
        }
    }
}
