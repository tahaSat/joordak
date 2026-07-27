<?php

namespace App\Http\Controllers;

use App\Enums\InvoiceStatus;
use App\Models\Invoice;
use App\Models\Setting;
use App\Services\DiscountService;
use App\Services\PendingInvoicePaymentService;
use App\Support\IranProvince;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class CheckoutController extends Controller
{
    public function __construct(private readonly DiscountService $discounts) {}

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
                'address_province' => $request->user()->address_province,
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

    public function show(
        Request $request,
        Invoice $invoice,
        PendingInvoicePaymentService $pendingPayments,
    ): Response {
        abort_if($invoice->user_id !== $request->user()->id, 403);

        return Inertia::render('Invoices/Show', [
            'invoice' => $pendingPayments->forDisplay($invoice),
        ]);
    }

    public function applyDiscount(
        Request $request,
        Invoice $invoice,
        PendingInvoicePaymentService $pendingPayments,
    ): RedirectResponse {
        $this->authorizePendingMutation($request, $invoice, $pendingPayments);

        $validated = $request->validate([
            'code' => ['required', 'string', 'max:255'],
        ]);

        $result = DB::transaction(function () use ($invoice, $validated, $pendingPayments): array {
            $lockedInvoice = Invoice::query()->lockForUpdate()->findOrFail($invoice->id);
            $this->assertPendingMutationAllowed($lockedInvoice, $pendingPayments);
            $refreshed = $pendingPayments->refresh($lockedInvoice);
            $subtotal = (int) $refreshed['invoice']->items->sum('line_total');
            $result = $this->discounts->validateCode($validated['code'], $subtotal);

            if ($result['ok']) {
                $this->discounts->recalculateInvoice($lockedInvoice, $result['code']);
                $pendingPayments->refresh($lockedInvoice);
            }

            return $result;
        });

        if (! $result['ok']) {
            return back()->withErrors(['code' => $result['message']]);
        }

        return back()->with('success', 'کد تخفیف روی فاکتور اعمال شد.');
    }

    public function removeDiscount(
        Request $request,
        Invoice $invoice,
        PendingInvoicePaymentService $pendingPayments,
    ): RedirectResponse {
        $this->authorizePendingMutation($request, $invoice, $pendingPayments);

        DB::transaction(function () use ($invoice, $pendingPayments): void {
            $lockedInvoice = Invoice::query()->lockForUpdate()->findOrFail($invoice->id);
            $this->assertPendingMutationAllowed($lockedInvoice, $pendingPayments);
            $this->discounts->recalculateInvoice($lockedInvoice, null);
            $pendingPayments->refresh($lockedInvoice);
        });

        return back()->with('success', 'کد تخفیف حذف شد.');
    }

    public function updateItem(
        Request $request,
        Invoice $invoice,
        int $invoiceItem,
        PendingInvoicePaymentService $pendingPayments,
    ): RedirectResponse {
        $this->authorizePendingMutation($request, $invoice, $pendingPayments);

        $validated = $request->validate([
            'quantity' => ['required', 'integer', 'between:1,20'],
        ]);

        DB::transaction(function () use ($invoice, $invoiceItem, $validated, $pendingPayments): void {
            $lockedInvoice = Invoice::query()->lockForUpdate()->findOrFail($invoice->id);
            $this->assertPendingMutationAllowed($lockedInvoice, $pendingPayments);

            $item = $lockedInvoice->items()->lockForUpdate()->findOrFail($invoiceItem);
            $item->forceFill(['quantity' => $validated['quantity']])->save();
            $result = $pendingPayments->refresh($lockedInvoice);

            if ($result['stock_failures'] !== []) {
                throw ValidationException::withMessages([
                    'quantity' => 'تعداد درخواستی از موجودی قابل فروش بیشتر است.',
                ]);
            }
        });

        return back()->with('success', 'تعداد کالا به‌روزرسانی شد.');
    }

    public function destroyItem(
        Request $request,
        Invoice $invoice,
        int $invoiceItem,
        PendingInvoicePaymentService $pendingPayments,
    ): RedirectResponse {
        $this->authorizePendingMutation($request, $invoice, $pendingPayments);

        DB::transaction(function () use ($invoice, $invoiceItem, $pendingPayments): void {
            $lockedInvoice = Invoice::query()->lockForUpdate()->findOrFail($invoice->id);
            $this->assertPendingMutationAllowed($lockedInvoice, $pendingPayments);
            abort_if($lockedInvoice->items()->count() <= 1, 422, 'Delete the invoice instead.');

            $lockedInvoice->items()->lockForUpdate()->findOrFail($invoiceItem)->delete();
            $pendingPayments->refresh($lockedInvoice);
        });

        return back()->with('success', 'کالا از فاکتور حذف شد.');
    }

    public function destroy(
        Request $request,
        Invoice $invoice,
        PendingInvoicePaymentService $pendingPayments,
    ): RedirectResponse {
        $this->authorizePendingMutation($request, $invoice, $pendingPayments);

        DB::transaction(function () use ($invoice, $pendingPayments): void {
            $lockedInvoice = Invoice::query()->lockForUpdate()->findOrFail($invoice->id);
            abort_unless($lockedInvoice->status === InvoiceStatus::PendingPayment, 409);
            abort_if($pendingPayments->hasActiveGatewaySession($lockedInvoice), 409);
            abort_unless($lockedInvoice->items()->count() === 1, 422);
            $lockedInvoice->delete();
        });

        return redirect()->route('dashboard')->with('success', 'فاکتور حذف شد.');
    }

    public function preparePayment(
        Request $request,
        Invoice $invoice,
        PendingInvoicePaymentService $pendingPayments,
    ): JsonResponse {
        abort_if($invoice->user_id !== $request->user()->id, 403);

        $prepared = DB::transaction(function () use ($invoice, $pendingPayments): array {
            $lockedInvoice = Invoice::query()->lockForUpdate()->findOrFail($invoice->id);

            if (! $lockedInvoice->status->canBePaid()) {
                return ['blocked' => 'status'];
            }

            if ($pendingPayments->hasActiveGatewaySession($lockedInvoice)) {
                return ['blocked' => 'active_session'];
            }

            return ['blocked' => null, 'result' => $pendingPayments->refresh($lockedInvoice)];
        });

        if ($prepared['blocked'] === 'status') {
            return response()->json(['ok' => false, 'message' => 'امکان پرداخت این فاکتور وجود ندارد.'], 422);
        }

        if ($prepared['blocked'] === 'active_session') {
            return response()->json([
                'ok' => false,
                'message' => 'یک نشست پرداخت فعال برای این فاکتور وجود دارد.',
            ], 409);
        }

        $result = $prepared['result'];

        return response()->json([
            'ok' => count($result['stock_failures']) === 0,
            'changed' => $result['changed'],
            'differences' => $result['differences'],
            'stock_failures' => $result['stock_failures'],
            'quote' => $result['quote'],
            'invoice' => $result['invoice'],
        ], count($result['stock_failures']) === 0 ? 200 : 422);
    }

    private function authorizePendingMutation(
        Request $request,
        Invoice $invoice,
        PendingInvoicePaymentService $pendingPayments,
    ): void {
        abort_if($invoice->user_id !== $request->user()->id, 403);
        abort_unless($invoice->status === InvoiceStatus::PendingPayment, 409);
        abort_if($pendingPayments->hasActiveGatewaySession($invoice), 409, 'An active payment session exists.');
    }

    private function assertPendingMutationAllowed(
        Invoice $invoice,
        PendingInvoicePaymentService $pendingPayments,
    ): void {
        abort_unless($invoice->status === InvoiceStatus::PendingPayment, 409);
        abort_if($pendingPayments->hasActiveGatewaySession($invoice), 409, 'An active payment session exists.');
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
