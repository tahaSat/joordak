<?php

namespace App\Services;

use App\Enums\InvoiceStatus;
use App\Enums\PaymentStatus;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\SubProduct;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class PaymentLifecycleService
{
    public function __construct(private readonly DiscountService $discounts) {}

    public function markProcessing(Payment $payment, array $requestPayload): Payment
    {
        return DB::transaction(function () use ($payment, $requestPayload) {
            $invoice = Invoice::query()->lockForUpdate()->findOrFail($payment->invoice_id);
            $payment = Payment::query()->lockForUpdate()->findOrFail($payment->id);

            $payment->forceFill([
                'status' => PaymentStatus::Processing,
                'gateway_track_id' => $requestPayload['trackId'] ?? $payment->gateway_track_id,
                'request_payload' => $requestPayload,
                'requested_at' => $payment->requested_at ?? now(),
                'failed_at' => null,
                'failure_message' => null,
            ])->save();

            $invoice->forceFill([
                'status' => InvoiceStatus::ProcessingPayment,
                'payment_reference' => $payment->gateway_track_id,
            ])->save();

            return $payment->refresh();
        });
    }

    public function markPaid(Payment $payment, array $verifyPayload, ?array $callbackPayload = null, ?array $inquiryPayload = null): Payment
    {
        return DB::transaction(function () use ($payment, $verifyPayload, $callbackPayload, $inquiryPayload) {
            $invoice = Invoice::query()
                ->lockForUpdate()
                ->findOrFail($payment->invoice_id);
            $payment = Payment::query()->lockForUpdate()->findOrFail($payment->id);
            $invoice->setRelation(
                'items',
                $invoice->items()->orderBy('id')->lockForUpdate()->get(),
            );
            $shouldDeductStock = $invoice->status !== InvoiceStatus::Paid;
            $paidAt = $verifyPayload['paidAt'] ?? $inquiryPayload['paidAt'] ?? $payment->paid_at ?? now();

            if ((int) $payment->amount !== (int) $invoice->total) {
                throw new RuntimeException('Paid amount does not match the locked invoice total.');
            }

            if ($shouldDeductStock) {
                $this->deductInvoiceStock($invoice);
            }

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
                $this->discounts->recordRedemptions($invoice);
            }

            return $payment->refresh();
        });
    }

    public function markFailed(Payment $payment, string $message, ?array $callbackPayload = null, ?array $verifyPayload = null, ?array $inquiryPayload = null): Payment
    {
        return DB::transaction(function () use ($payment, $message, $callbackPayload, $verifyPayload, $inquiryPayload) {
            $invoice = Invoice::query()->lockForUpdate()->findOrFail($payment->invoice_id);
            $payment = Payment::query()->lockForUpdate()->findOrFail($payment->id);

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

            if ($invoice->status !== InvoiceStatus::Paid) {
                $invoice->forceFill([
                    'status' => InvoiceStatus::Failed,
                    'payment_reference' => $payment->gateway_track_id,
                ])->save();
            }

            return $payment->refresh();
        });
    }

    public function markExpired(Payment $payment, string $message = 'Payment session expired.', ?array $verifyPayload = null, ?array $inquiryPayload = null): Payment
    {
        return DB::transaction(function () use ($payment, $message, $verifyPayload, $inquiryPayload) {
            $invoice = Invoice::query()->lockForUpdate()->findOrFail($payment->invoice_id);
            $payment = Payment::query()->lockForUpdate()->findOrFail($payment->id);

            if ($payment->status === PaymentStatus::Paid) {
                return $payment->refresh();
            }

            $payment->forceFill([
                'status' => PaymentStatus::Expired,
                'verify_payload' => $verifyPayload ?? $payment->verify_payload,
                'inquiry_payload' => $inquiryPayload ?? $payment->inquiry_payload,
                'failed_at' => $payment->failed_at ?? now(),
                'last_checked_at' => now(),
                'failure_message' => $message,
            ])->save();

            if ($invoice->status !== InvoiceStatus::Paid) {
                $invoice->forceFill([
                    'status' => InvoiceStatus::Cancelled,
                    'payment_reference' => $payment->gateway_track_id,
                ])->save();
            }

            return $payment->refresh();
        });
    }

    private function deductInvoiceStock(Invoice $invoice): void
    {
        if ($invoice->items->contains(fn ($item): bool => $item->sub_product_id === null)) {
            throw new RuntimeException('An invoice variant no longer exists.');
        }

        $quantities = $invoice->items
            ->whereNotNull('sub_product_id')
            ->groupBy('sub_product_id')
            ->map(fn ($items): int => (int) $items->sum('quantity'))
            ->sortKeys();

        $subProducts = SubProduct::query()
            ->whereIn('id', $quantities->keys())
            ->orderBy('id')
            ->lockForUpdate()
            ->get()
            ->keyBy('id');

        foreach ($quantities as $subProductId => $quantity) {
            $subProduct = $subProducts->get($subProductId);

            if (! $subProduct) {
                throw new RuntimeException("Invoice variant {$subProductId} no longer exists.");
            }

            if ((int) $subProduct->stock < $quantity) {
                throw new RuntimeException("Insufficient stock for invoice variant {$subProductId}.");
            }
        }

        foreach ($quantities as $subProductId => $quantity) {
            $subProduct = $subProducts->get($subProductId);
            $subProduct->forceFill(['stock' => (int) $subProduct->stock - $quantity])->save();
        }
    }
}
