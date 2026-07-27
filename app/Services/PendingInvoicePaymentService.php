<?php

namespace App\Services;

use App\Enums\PaymentStatus;
use App\Models\DiscountCode;
use App\Models\Invoice;
use App\Models\Product;
use App\Models\Setting;
use App\Models\SubProduct;
use App\Support\IranProvince;
use Illuminate\Support\Facades\DB;

class PendingInvoicePaymentService
{
    public function __construct(private readonly DiscountService $discounts) {}

    /**
     * @return array{
     *     invoice: Invoice,
     *     changed: bool,
     *     differences: array<string, mixed>,
     *     stock_failures: array<int, array<string, mixed>>,
     *     quote: string
     * }
     */
    public function refresh(Invoice $invoice): array
    {
        return DB::transaction(function () use ($invoice): array {
            $invoice = Invoice::query()->lockForUpdate()->findOrFail($invoice->id);
            $items = $invoice->items()->orderBy('id')->lockForUpdate()->get();
            $before = $this->snapshot($invoice, $items);

            $variantIds = $items->pluck('sub_product_id')->filter()->unique()->sort()->values();
            $variants = SubProduct::query()
                ->whereIn('id', $variantIds)
                ->orderBy('id')
                ->lockForUpdate()
                ->get()
                ->keyBy('id');
            $products = Product::query()
                ->whereIn('id', $variants->pluck('product_id')->unique()->sort()->values())
                ->orderBy('id')
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            foreach ($items as $item) {
                $variant = $item->sub_product_id ? $variants->get($item->sub_product_id) : null;

                if (! $variant) {
                    continue;
                }

                $pricing = $this->discounts->effectiveVariantPrice($variant);
                $item->forceFill([
                    'unit_price' => $pricing['discounted'],
                    'original_unit_price' => $pricing['original'],
                    'product_discount_amount' => $pricing['reduction'] * $item->quantity,
                    'line_total' => $pricing['discounted'] * $item->quantity,
                ])->save();
            }

            $subtotal = (int) $items->sum('line_total');
            $discountCode = $this->lockedUsableDiscount($invoice);
            $invoiceDiscount = $discountCode?->computeDiscount($subtotal) ?? 0;
            $shippingCost = $this->shippingCostForProvince($invoice->address_province);

            $invoice->forceFill([
                'subtotal' => $subtotal,
                'discount_code_id' => $invoiceDiscount > 0 ? $discountCode?->id : null,
                'discount_code' => $invoiceDiscount > 0 ? $discountCode?->code : null,
                'invoice_discount_amount' => $invoiceDiscount,
                'shipping_cost' => $shippingCost,
                'total' => max(0, $subtotal - $invoiceDiscount) + $shippingCost,
            ])->save();

            $invoice->payments()
                ->where('status', PaymentStatus::Pending->value)
                ->update(['amount' => $invoice->total]);

            $items = $invoice->items()->orderBy('id')->get();
            $after = $this->snapshot($invoice, $items);
            $stockFailures = $this->stockFailures($items, $variants, $products);

            return [
                'invoice' => $this->forDisplay($invoice),
                'changed' => $before !== $after,
                'differences' => $this->differences($before, $after),
                'stock_failures' => $stockFailures,
                'quote' => $this->quoteForSnapshot($invoice, $items),
            ];
        });
    }

    public function quoteMatches(Invoice $invoice, string $quote): bool
    {
        $invoice->loadMissing('items');

        return hash_equals($this->quoteForSnapshot($invoice, $invoice->items->sortBy('id')), $quote);
    }

    public function hasActiveGatewaySession(Invoice $invoice): bool
    {
        return $invoice->payments()
            ->where('status', PaymentStatus::Processing->value)
            ->whereNotNull('gateway_track_id')
            ->exists();
    }

    public function forDisplay(Invoice $invoice): Invoice
    {
        $invoice = $invoice->fresh(['items.subProduct.product', 'latestPayment']);

        foreach ($invoice->items as $item) {
            $variant = $item->subProduct;
            $item->setAttribute('current_stock', (int) ($variant?->stock ?? 0));
            $item->setAttribute('product_is_active', (bool) ($variant?->product?->is_active ?? false));
            $item->unsetRelation('subProduct');
        }

        return $invoice;
    }

    /**
     * @param  iterable<int, mixed>  $items
     * @return array<string, mixed>
     */
    private function snapshot(Invoice $invoice, iterable $items): array
    {
        return [
            'subtotal' => (int) $invoice->subtotal,
            'invoice_discount_amount' => (int) $invoice->invoice_discount_amount,
            'discount_code' => $invoice->discount_code,
            'shipping_cost' => (int) $invoice->shipping_cost,
            'total' => (int) $invoice->total,
            'items' => collect($items)->mapWithKeys(fn ($item): array => [
                (string) $item->id => [
                    'id' => $item->id,
                    'product_name' => $item->product_name,
                    'original_unit_price' => (int) $item->original_unit_price,
                    'unit_price' => (int) $item->unit_price,
                    'product_discount_amount' => (int) $item->product_discount_amount,
                    'quantity' => (int) $item->quantity,
                    'line_total' => (int) $item->line_total,
                ],
            ])->all(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function differences(array $before, array $after): array
    {
        $itemDifferences = [];

        foreach ($after['items'] as $id => $new) {
            $old = $before['items'][$id] ?? null;
            if ($old !== $new) {
                $itemDifferences[] = ['old' => $old, 'new' => $new];
            }
        }

        return [
            'items' => $itemDifferences,
            'discount' => [
                'old' => $before['invoice_discount_amount'],
                'new' => $after['invoice_discount_amount'],
                'old_code' => $before['discount_code'],
                'new_code' => $after['discount_code'],
            ],
            'shipping' => ['old' => $before['shipping_cost'], 'new' => $after['shipping_cost']],
            'subtotal' => ['old' => $before['subtotal'], 'new' => $after['subtotal']],
            'total' => ['old' => $before['total'], 'new' => $after['total']],
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function stockFailures(iterable $items, $variants, $products): array
    {
        return collect($items)
            ->groupBy(fn ($item): string => $item->sub_product_id
                ? 'variant-'.$item->sub_product_id
                : 'missing-'.$item->id)
            ->map(function ($group) use ($variants, $products): ?array {
                $first = $group->first();
                $variant = $first->sub_product_id ? $variants->get($first->sub_product_id) : null;
                $product = $variant ? $products->get($variant->product_id) : null;
                $requested = (int) $group->sum('quantity');
                $reason = match (true) {
                    ! $variant => 'variant_unavailable',
                    ! $product || ! $product->is_active => 'product_inactive',
                    $variant->stock < $requested => 'insufficient_stock',
                    default => null,
                };

                if ($reason === null) {
                    return null;
                }

                return [
                    'invoice_item_id' => $first->id,
                    'invoice_item_ids' => $group->pluck('id')->values()->all(),
                    'sub_product_id' => $first->sub_product_id,
                    'product_name' => $first->product_name,
                    'requested' => $requested,
                    'available' => (int) ($variant?->stock ?? 0),
                    'reason' => $reason,
                ];
            })
            ->filter()
            ->values()
            ->all();
    }

    private function lockedUsableDiscount(Invoice $invoice): ?DiscountCode
    {
        if (! $invoice->discount_code_id) {
            return null;
        }

        $discountCode = DiscountCode::query()
            ->lockForUpdate()
            ->find($invoice->discount_code_id);

        return $discountCode?->isCurrentlyValid() ? $discountCode : null;
    }

    private function shippingCostForProvince(?string $province): int
    {
        $settingKey = IranProvince::isTehran($province) ? 'post_cost_tehran' : 'post_cost_others';

        return max(0, (int) Setting::getValue($settingKey, '0'));
    }

    private function quoteForSnapshot(Invoice $invoice, iterable $items): string
    {
        $payload = [
            'invoice_id' => $invoice->id,
            'subtotal' => (int) $invoice->subtotal,
            'discount_code_id' => $invoice->discount_code_id,
            'invoice_discount_amount' => (int) $invoice->invoice_discount_amount,
            'shipping_cost' => (int) $invoice->shipping_cost,
            'total' => (int) $invoice->total,
            'items' => collect($items)->map(fn ($item): array => [
                'id' => $item->id,
                'sub_product_id' => $item->sub_product_id,
                'quantity' => (int) $item->quantity,
                'unit_price' => (int) $item->unit_price,
                'line_total' => (int) $item->line_total,
            ])->values()->all(),
        ];

        return hash_hmac('sha256', json_encode($payload, JSON_THROW_ON_ERROR), (string) config('app.key'));
    }
}
