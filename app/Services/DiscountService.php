<?php

namespace App\Services;

use App\Models\DiscountCode;
use App\Models\Invoice;
use App\Models\SubProduct;
use Illuminate\Support\Facades\DB;

class DiscountService
{
    public const CART_SESSION_KEY = 'cart_discount_code';

    /**
     * Resolve the effective unit price for a variant, applying any active
     * product-level discount.
     *
     * @return array{original: int, discounted: int, reduction: int}
     */
    public function effectiveVariantPrice(SubProduct $subProduct): array
    {
        $original = (int) $subProduct->price;
        $reduction = $subProduct->discountAmount();

        return [
            'original' => $original,
            'discounted' => max(0, $original - $reduction),
            'reduction' => $reduction,
        ];
    }

    /**
     * Look up a usable discount code by its raw text.
     */
    public function findUsableCode(?string $code): ?DiscountCode
    {
        $code = trim((string) $code);

        if ($code === '') {
            return null;
        }

        $discountCode = DiscountCode::query()
            ->whereRaw('LOWER(code) = ?', [mb_strtolower($code)])
            ->first();

        if (! $discountCode || ! $discountCode->isCurrentlyValid()) {
            return null;
        }

        return $discountCode;
    }

    /**
     * Validate a discount code against a subtotal.
     *
     * @return array{ok: bool, code: ?DiscountCode, amount: int, message: ?string}
     */
    public function validateCode(?string $code, int $subtotal): array
    {
        $discountCode = $this->findUsableCode($code);

        if (! $discountCode) {
            return [
                'ok' => false,
                'code' => null,
                'amount' => 0,
                'message' => 'کد تخفیف نامعتبر یا منقضی شده است.',
            ];
        }

        $amount = $discountCode->computeDiscount($subtotal);

        if ($amount <= 0) {
            return [
                'ok' => false,
                'code' => null,
                'amount' => 0,
                'message' => 'این کد تخفیف برای این سفارش قابل اعمال نیست.',
            ];
        }

        return [
            'ok' => true,
            'code' => $discountCode,
            'amount' => $amount,
            'message' => null,
        ];
    }

    /**
     * Increment usage counters for the variant- and code-level discounts that
     * were actually redeemed on a paid invoice. Must be called inside a
     * transaction with the invoice locked.
     */
    public function recordRedemptions(Invoice $invoice): void
    {
        $invoice->loadMissing('items');

        $invoice->items
            ->whereNotNull('sub_product_id')
            ->where('product_discount_amount', '>', 0)
            ->pluck('sub_product_id')
            ->unique()
            ->each(function (int|string $subProductId): void {
                SubProduct::query()
                    ->whereKey($subProductId)
                    ->whereNotNull('discount_type')
                    ->increment('discount_used_count');
            });

        if ($invoice->discount_code_id && $invoice->invoice_discount_amount > 0) {
            DiscountCode::query()
                ->whereKey($invoice->discount_code_id)
                ->increment('used_count');
        }
    }

    /**
     * Recompute and persist an invoice's monetary fields based on its current
     * items and an optional discount code.
     */
    public function recalculateInvoice(Invoice $invoice, ?DiscountCode $discountCode = null): Invoice
    {
        return DB::transaction(function () use ($invoice, $discountCode): Invoice {
            $invoice->loadMissing('items');

            $subtotal = (int) $invoice->items->sum('line_total');

            $invoiceDiscount = 0;
            if ($discountCode && $discountCode->isCurrentlyValid()) {
                $invoiceDiscount = $discountCode->computeDiscount($subtotal);
            }

            $shippingCost = (int) $invoice->shipping_cost;

            $invoice->forceFill([
                'subtotal' => $subtotal,
                'discount_code_id' => $invoiceDiscount > 0 ? $discountCode?->id : null,
                'discount_code' => $invoiceDiscount > 0 ? $discountCode?->code : null,
                'invoice_discount_amount' => $invoiceDiscount,
                'total' => max(0, $subtotal - $invoiceDiscount) + $shippingCost,
            ])->save();

            return $invoice->refresh();
        });
    }
}
