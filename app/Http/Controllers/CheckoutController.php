<?php

namespace App\Http\Controllers;

use App\Enums\InvoiceStatus;
use App\Enums\PaymentStatus;
use App\Models\Invoice;
use App\Models\Setting;
use App\Services\DiscountService;
use App\Support\IranProvince;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class CheckoutController extends Controller
{
    public function __construct(private readonly DiscountService $discounts)
    {
    }

    public function store(Request $request): RedirectResponse
    {
        $items = $request->user()
            ->cartItems()
            ->with(['product:id,title', 'subProduct'])
            ->get();

        if ($items->isEmpty()) {
            return back()->withErrors(['cart' => 'Your cart is empty.']);
        }

        if (blank($request->user()->address_province)) {
            return back()->withErrors(['address_province' => 'لطفاً استان خود را در پروفایل تکمیل کنید.']);
        }

        foreach ($items as $item) {
            if (! $item->subProduct || $item->quantity > $item->subProduct->stock) {
                return back()->withErrors(['stock' => 'موجودی محصول کافی نیست']);
            }
        }

        $appliedCode = $this->discounts->findUsableCode($request->session()->get(DiscountService::CART_SESSION_KEY));

        $invoice = DB::transaction(function () use ($request, $items, $appliedCode) {
            $lineItems = $items->map(function ($item): array {
                $pricing = $this->discounts->effectiveVariantPrice($item->subProduct);

                return [
                    'product_id' => $item->product_id,
                    'sub_product_id' => $item->sub_product_id,
                    'product_name' => $this->invoiceProductName($item),
                    'unit_price' => $pricing['discounted'],
                    'original_unit_price' => $pricing['original'],
                    'product_discount_amount' => $pricing['reduction'] * $item->quantity,
                    'quantity' => $item->quantity,
                    'line_total' => $pricing['discounted'] * $item->quantity,
                ];
            });

            $subtotal = (int) $lineItems->sum('line_total');
            $invoiceDiscount = $appliedCode ? $appliedCode->computeDiscount($subtotal) : 0;
            $shippingCost = $this->shippingCostForProvince($request->user()->address_province);

            $invoice = $request->user()->invoices()->create([
                'subtotal' => $subtotal,
                'discount_code_id' => $invoiceDiscount > 0 ? $appliedCode?->id : null,
                'discount_code' => $invoiceDiscount > 0 ? $appliedCode?->code : null,
                'invoice_discount_amount' => $invoiceDiscount,
                'shipping_cost' => $shippingCost,
                'address' => $request->user()->deliveryAddress(),
                'postal_code' => $request->user()->postal_code,
                'total' => max(0, $subtotal - $invoiceDiscount) + $shippingCost,
                'status' => InvoiceStatus::PendingPayment,
                'payment_reference' => null,
            ]);

            $invoice->items()->createMany($lineItems->all());

            $request->user()->cartItems()->delete();

            return $invoice;
        });

        $request->session()->forget(DiscountService::CART_SESSION_KEY);

        return redirect()->route('invoices.show', $invoice)->with('success', 'فاکتور ایجاد شد. برای پرداخت از دکمه پرداخت استفاده کنید.');
    }

    private function shippingCostForProvince(?string $province): int
    {
        $settingKey = IranProvince::isTehran($province) ? 'post_cost_tehran' : 'post_cost_others';

        return max(0, (int) Setting::getValue($settingKey, '0'));
    }

    public function show(Request $request, Invoice $invoice): Response
    {
        abort_if($invoice->user_id !== $request->user()->id, 403);

        $invoice->load(['items', 'latestPayment']);

        return Inertia::render('Invoices/Show', [
            'invoice' => $invoice,
        ]);
    }

    public function applyDiscount(Request $request, Invoice $invoice): RedirectResponse
    {
        abort_if($invoice->user_id !== $request->user()->id, 403);

        $validated = $request->validate([
            'code' => ['required', 'string', 'max:255'],
        ]);

        if (! $invoice->status->canBePaid()) {
            return back()->withErrors(['code' => 'امکان اعمال کد تخفیف روی این فاکتور وجود ندارد.']);
        }

        $invoice->loadMissing('items');
        $subtotal = (int) $invoice->items->sum('line_total');

        $result = $this->discounts->validateCode($validated['code'], $subtotal);

        if (! $result['ok']) {
            return back()->withErrors(['code' => $result['message']]);
        }

        $this->discounts->recalculateInvoice($invoice, $result['code']);
        $this->syncPendingPayments($invoice);

        return back()->with('success', 'کد تخفیف روی فاکتور اعمال شد.');
    }

    public function removeDiscount(Request $request, Invoice $invoice): RedirectResponse
    {
        abort_if($invoice->user_id !== $request->user()->id, 403);

        if (! $invoice->status->canBePaid()) {
            return back()->withErrors(['code' => 'امکان تغییر کد تخفیف روی این فاکتور وجود ندارد.']);
        }

        $this->discounts->recalculateInvoice($invoice, null);
        $this->syncPendingPayments($invoice);

        return back()->with('success', 'کد تخفیف حذف شد.');
    }

    private function syncPendingPayments(Invoice $invoice): void
    {
        $invoice->payments()
            ->where('status', PaymentStatus::Pending->value)
            ->update(['amount' => $invoice->total]);
    }

    private function invoiceProductName($item): string
    {
        $name = $item->product->title ?? 'Deleted Product';
        $details = collect([
            $item->subProduct?->size ? "سایز: {$item->subProduct->size}" : null,
            $item->subProduct?->color_name ? "رنگ: {$item->subProduct->color_name}" : null,
        ])->filter()->implode(' - ');

        return $details ? "{$name} ({$details})" : $name;
    }
}
