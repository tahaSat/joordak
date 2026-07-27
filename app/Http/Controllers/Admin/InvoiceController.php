<?php

namespace App\Http\Controllers\Admin;

use App\Enums\InvoiceStatus;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Setting;
use App\Models\SubProduct;
use App\Services\DiscountService;
use App\Services\InvoicePdfExporter;
use App\Services\SmsService;
use App\Support\IranProvince;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class InvoiceController extends Controller
{
    public function __construct(private readonly DiscountService $discounts) {}

    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Invoice::class);

        $filters = $request->only(['search', 'status', 'from', 'until']);

        $invoices = $this->filteredInvoicesQuery($filters)
            ->with(['user', 'items'])
            ->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Invoice $invoice): array => $this->summary($invoice));

        return Inertia::render('Admin/Invoices/Index', [
            'invoices' => $invoices,
            'filters' => $filters,
            'statuses' => InvoiceStatus::labelsFa(),
        ]);
    }

    public function export(Request $request): HttpResponse
    {
        Gate::authorize('viewAny', Invoice::class);

        $filters = $request->only(['search', 'status', 'from', 'until']);
        $fileName = 'invoices-'.now()->format('Y-m-d-His').'.pdf';

        $rows = $this->filteredInvoicesQuery($filters)
            ->with(['user', 'items'])
            ->oldest('id')
            ->get()
            ->map(fn (Invoice $invoice): array => $this->exportRow($invoice));

        $pdfContent = app(InvoicePdfExporter::class)->download(
            $rows->all(),
            now()->format('Y-m-d H:i'),
            $fileName,
        );

        return response($pdfContent, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="'.$fileName.'"',
        ]);
    }

    public function show(Invoice $invoice): Response
    {
        Gate::authorize('view', $invoice);

        $invoice->load(['user', 'items.subProduct.product:id,is_active', 'latestPayment']);

        return Inertia::render('Admin/Invoices/Show', [
            'invoice' => [
                ...$this->summary($invoice),
                'subtotal' => (float) $invoice->subtotal,
                'invoice_discount_amount' => (float) $invoice->invoice_discount_amount,
                'discount_code' => $invoice->discount_code,
                'payment_reference' => $invoice->payment_reference,
                'post_tracking_code' => $invoice->post_tracking_code,
                'paid_at' => $invoice->paid_at?->toISOString(),
                'items' => $invoice->items->map(fn ($item): array => [
                    'id' => $item->id,
                    'product_name' => $item->product_name,
                    'unit_price' => (float) $item->unit_price,
                    'original_unit_price' => (float) $item->original_unit_price,
                    'product_discount_amount' => (float) $item->product_discount_amount,
                    'quantity' => $item->quantity,
                    'line_total' => (float) $item->line_total,
                    'current_stock' => (int) ($item->subProduct?->stock ?? 0),
                    'product_is_active' => (bool) ($item->subProduct?->product?->is_active ?? false),
                ]),
                'latest_payment' => $invoice->latestPayment ? [
                    'id' => $invoice->latestPayment->id,
                    'status' => $invoice->latestPayment->status,
                    'gateway_track_id' => $invoice->latestPayment->gateway_track_id,
                    'gateway_ref_number' => $invoice->latestPayment->gateway_ref_number,
                ] : null,
            ],
            'stock_warnings' => session('stock_warnings', []),
        ]);
    }

    public function update(Request $request, Invoice $invoice): RedirectResponse
    {
        Gate::authorize('update', $invoice);

        $validated = $request->validate([
            'invoice_discount_amount' => ['required', 'integer', 'min:0'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.id' => ['required', 'integer'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:999'],
        ]);

        $stockWarnings = DB::transaction(function () use ($invoice, $validated): array {
            $lockedInvoice = Invoice::query()->lockForUpdate()->findOrFail($invoice->id);
            $lockedItems = InvoiceItem::query()
                ->where('invoice_id', $lockedInvoice->id)
                ->orderBy('id')
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $payloadIds = collect($validated['items'])->pluck('id')->map(fn ($id): int => (int) $id)->sort()->values();
            $existingIds = $lockedItems->keys()->sort()->values();

            if ($payloadIds->all() !== $existingIds->all()) {
                throw ValidationException::withMessages([
                    'items' => 'اقلام فاکتور با دادهٔ ارسال‌شده هم‌خوانی ندارد.',
                ]);
            }

            foreach ($validated['items'] as $itemData) {
                $lockedItems->get((int) $itemData['id'])
                    ->forceFill(['quantity' => (int) $itemData['quantity']])
                    ->save();
            }

            $lockedItems = InvoiceItem::query()
                ->where('invoice_id', $lockedInvoice->id)
                ->orderBy('id')
                ->lockForUpdate()
                ->get();

            $variants = SubProduct::query()
                ->with('product:id,is_active')
                ->whereIn('id', $lockedItems->pluck('sub_product_id')->filter()->unique())
                ->orderBy('id')
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $stockWarnings = [];

            foreach ($lockedItems as $item) {
                $variant = $item->sub_product_id ? $variants->get($item->sub_product_id) : null;

                if (! $variant) {
                    $stockWarnings[] = [
                        'item_id' => $item->id,
                        'product_name' => $item->product_name,
                        'requested' => (int) $item->quantity,
                        'available' => 0,
                        'reason' => 'unavailable',
                    ];

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

            $lockedItems
                ->whereNotNull('sub_product_id')
                ->groupBy('sub_product_id')
                ->each(function ($group, int|string $subProductId) use ($variants, &$stockWarnings): void {
                    $variant = $variants->get($subProductId);
                    $requested = (int) $group->sum('quantity');
                    $available = (int) ($variant?->stock ?? 0);
                    $active = (bool) ($variant?->product?->is_active ?? false);

                    if (! $variant || ! $active) {
                        $stockWarnings[] = [
                            'item_id' => $group->first()->id,
                            'product_name' => $group->first()->product_name,
                            'requested' => $requested,
                            'available' => 0,
                            'reason' => 'unavailable',
                        ];

                        return;
                    }

                    if ($requested > $available) {
                        $stockWarnings[] = [
                            'item_id' => $group->first()->id,
                            'product_name' => $group->first()->product_name,
                            'requested' => $requested,
                            'available' => $available,
                            'reason' => 'insufficient_stock',
                        ];
                    }
                });

            $subtotal = (int) $lockedItems->sum('line_total');
            $invoiceDiscount = min((int) $validated['invoice_discount_amount'], $subtotal);
            $shippingCost = $this->shippingCostForProvince($lockedInvoice->address_province);

            $lockedInvoice->forceFill([
                'subtotal' => $subtotal,
                'invoice_discount_amount' => $invoiceDiscount,
                'shipping_cost' => $shippingCost,
                'total' => max(0, $subtotal - $invoiceDiscount) + $shippingCost,
                'discount_code_id' => $invoiceDiscount > 0 ? $lockedInvoice->discount_code_id : null,
                'discount_code' => $invoiceDiscount > 0 ? $lockedInvoice->discount_code : null,
            ])->save();

            $lockedInvoice->payments()
                ->where('status', PaymentStatus::Pending->value)
                ->update(['amount' => $lockedInvoice->total]);

            return $stockWarnings;
        });

        $redirect = back()->with('status', 'فاکتور با موفقیت به‌روزرسانی شد.');

        return $stockWarnings === []
            ? $redirect
            : $redirect->with('stock_warnings', $stockWarnings);
    }

    private function shippingCostForProvince(?string $province): int
    {
        $settingKey = IranProvince::isTehran($province) ? 'post_cost_tehran' : 'post_cost_others';

        return max(0, (int) Setting::getValue($settingKey, '0'));
    }

    public function cancel(Invoice $invoice): RedirectResponse
    {
        Gate::authorize('update', $invoice);

        abort_if(
            in_array($invoice->status, [InvoiceStatus::Cancelled, InvoiceStatus::DeliveredToPost], true),
            422,
            'This invoice cannot be cancelled.'
        );

        $invoice->forceFill([
            'status' => InvoiceStatus::Cancelled,
        ])->save();

        return back()->with('status', 'سفارش لغو شد.');
    }

    public function deliverToPost(Request $request, Invoice $invoice, SmsService $smsService): RedirectResponse
    {
        Gate::authorize('update', $invoice);

        abort_unless($invoice->status === InvoiceStatus::Paid, 422, 'Only paid invoices can be delivered to post.');

        $data = $request->validate([
            'post_tracking_code' => ['nullable', 'string', 'max:255'],
        ]);

        $invoice->forceFill([
            'status' => InvoiceStatus::DeliveredToPost,
            'post_tracking_code' => filled($data['post_tracking_code'] ?? null)
                ? $data['post_tracking_code']
                : $invoice->post_tracking_code,
        ])->save();

        $invoice->loadMissing('user');
        $phone = $invoice->user?->phone;

        if (filled($phone)) {
            try {
                $smsService->sendDeliveredToPostNotification(
                    $phone,
                    (string) ($invoice->post_tracking_code ?? ''),
                    route('invoices.show', $invoice, absolute: true),
                );
            } catch (\Throwable $exception) {
                report($exception);
            }
        }

        return back()->with('status', 'سفارش به عنوان تحویل به پست ثبت شد.');
    }

    /**
     * @param  array<string, string|null>  $filters
     */
    private function filteredInvoicesQuery(array $filters): Builder
    {
        return Invoice::query()
            ->when($filters['search'] ?? null, function (Builder $query, string $search): void {
                $query->whereHas('user', function (Builder $query) use ($search): void {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('surname', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->when($filters['status'] ?? null, fn (Builder $query, string $status): Builder => $query->where('status', $status))
            ->when($filters['from'] ?? null, fn (Builder $query, string $date): Builder => $query->whereDate('created_at', '>=', $date))
            ->when($filters['until'] ?? null, fn (Builder $query, string $date): Builder => $query->whereDate('created_at', '<=', $date));
    }

    /**
     * @return array<string, mixed>
     */
    private function exportRow(Invoice $invoice): array
    {
        $products = $invoice->items
            ->map(fn ($item): string => "{$item->product_name} × {$item->quantity} (".number_format($item->line_total).')')
            ->implode(' | ');

        return [
            'id' => $invoice->id,
            'created_at' => $invoice->created_at?->format('Y-m-d H:i') ?? '—',
            'status' => $invoice->status->labelFa(),
            'customer_name' => trim(($invoice->user?->name ?? '').' '.($invoice->user?->surname ?? '')) ?: 'بدون نام',
            'customer_phone' => $invoice->user?->phone ?? '—',
            'address' => $invoice->address ?? '—',
            'postal_code' => $invoice->postal_code ?? '—',
            'products' => $products ?: '—',
            'shipping_cost' => number_format($invoice->shipping_cost),
            'total' => number_format($invoice->total),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function summary(Invoice $invoice): array
    {
        return [
            'id' => $invoice->id,
            'status' => $invoice->status->value,
            'total' => (float) $invoice->total,
            'shipping_cost' => (float) $invoice->shipping_cost,
            'created_at' => $invoice->created_at?->toISOString(),
            'customer_name' => trim(($invoice->user?->name ?? '').' '.($invoice->user?->surname ?? '')),
            'customer_phone' => $invoice->user?->phone,
            'address' => $invoice->address,
            'postal_code' => $invoice->postal_code,
        ];
    }
}
