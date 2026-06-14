<?php

namespace App\Services;

use App\Enums\InvoiceStatus;
use App\Enums\PaymentStatus;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\SubProduct;
use Illuminate\Support\Facades\DB;

class PaymentLifecycleService
{
    public function __construct(private readonly DiscountService $discounts)
    {
    }

    public function markProcessing(Payment $payment, array $requestPayload): Payment
    {
        return DB::transaction(function () use ($payment, $requestPayload) {
            $payment = Payment::query()->lockForUpdate()->findOrFail($payment->id);

            $payment->forceFill([
                'status' => PaymentStatus::Processing,
                'gateway_track_id' => $requestPayload['trackId'] ?? $payment->gateway_track_id,
                'request_payload' => $requestPayload,
                'requested_at' => $payment->requested_at ?? now(),
                'failed_at' => null,
                'failure_message' => null,
            ])->save();

            $payment->invoice()->update([
                'status' => InvoiceStatus::ProcessingPayment,
                'payment_reference' => $payment->gateway_track_id,
            ]);

            return $payment->refresh();
        });
    }

    public function markPaid(Payment $payment, array $verifyPayload, ?array $callbackPayload = null, ?array $inquiryPayload = null): Payment
    {
        return DB::transaction(function () use ($payment, $verifyPayload, $callbackPayload, $inquiryPayload) {
            $payment = Payment::query()->lockForUpdate()->findOrFail($payment->id);
            $invoice = Invoice::query()
                ->with('items')
                ->lockForUpdate()
                ->findOrFail($payment->invoice_id);
            $shouldDeductStock = $invoice->status !== InvoiceStatus::Paid;
            $paidAt = $verifyPayload['paidAt'] ?? $inquiryPayload['paidAt'] ?? $payment->paid_at ?? now();

            $payment->forceFill([
                'status' => PaymentStatus::Paid,
                'gateway_ref_number' => $verifyPayload['refNumber'] ?? $inquiryPayload['refNumber'] ?? $payment->gateway_ref_number,
                'card_number' => $verifyPayload['cardNumber'] ?? $callbackPayload['cardNumber'] ?? $inquiryPayload['cardNumber'] ?? $payment->card_number,
                'hashed_card_number' => $callbackPayload['hashedCardNumber'] ?? $payment->hashed_card_number,
                'callback_payload' => $callbackPayload ?? $payment->callback_payload,
                'verify_payload' => $verifyPayload,
                'inquiry_payload' => $inquiryPayload ?? $payment->inquiry_payload,
                'paid_at' => $paidAt,
                'verified_at' => $payment->verified_at ?? now(),
                'last_checked_at' => now(),
                'failed_at' => null,
                'failure_message' => null,
            ])->save();

            $invoice->forceFill([
                'status' => InvoiceStatus::Paid,
                'payment_reference' => $payment->gateway_ref_number ?: $payment->gateway_track_id,
                'paid_at' => $payment->paid_at,
            ])->save();

            if ($shouldDeductStock) {
                $this->deductInvoiceStock($invoice);
                $this->discounts->recordRedemptions($invoice);
            }

            return $payment->refresh();
        });
    }

    public function markFailed(Payment $payment, string $message, ?array $callbackPayload = null, ?array $verifyPayload = null, ?array $inquiryPayload = null): Payment
    {
        return DB::transaction(function () use ($payment, $message, $callbackPayload, $verifyPayload, $inquiryPayload) {
            $payment = Payment::query()->with('invoice')->lockForUpdate()->findOrFail($payment->id);

            if ($payment->status === PaymentStatus::Paid) {
                return $payment->refresh();
            }

            $payment->forceFill([
                'status' => PaymentStatus::Failed,
                'callback_payload' => $callbackPayload ?? $payment->callback_payload,
                'verify_payload' => $verifyPayload ?? $payment->verify_payload,
                'inquiry_payload' => $inquiryPayload ?? $payment->inquiry_payload,
                'failed_at' => $payment->failed_at ?? now(),
                'last_checked_at' => now(),
                'failure_message' => $message,
            ])->save();

            if ($payment->invoice->status !== InvoiceStatus::Paid) {
                $payment->invoice->forceFill([
                    'status' => InvoiceStatus::Failed,
                    'payment_reference' => $payment->gateway_track_id,
                ])->save();
            }

            return $payment->refresh();
        });
    }

    private function deductInvoiceStock(Invoice $invoice): void
    {
        $invoice->items
            ->whereNotNull('sub_product_id')
            ->groupBy('sub_product_id')
            ->each(function ($items, int|string $subProductId): void {
                $quantity = $items->sum('quantity');
                $subProduct = SubProduct::query()->lockForUpdate()->find($subProductId);

                if (! $subProduct) {
                    return;
                }

                $subProduct->forceFill([
                    'stock' => max(0, $subProduct->stock - $quantity),
                ])->save();
            });
    }
}
