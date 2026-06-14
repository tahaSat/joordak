<?php

namespace App\Http\Controllers\Admin;

use App\Enums\InvoiceStatus;
use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Services\InvoicePdfExporter;
use App\Services\SmsService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class InvoiceController extends Controller
{
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

        $invoice->load(['user', 'items', 'latestPayment']);

        return Inertia::render('Admin/Invoices/Show', [
            'invoice' => [
                ...$this->summary($invoice),
                'payment_reference' => $invoice->payment_reference,
                'post_tracking_code' => $invoice->post_tracking_code,
                'paid_at' => $invoice->paid_at?->toISOString(),
                'items' => $invoice->items->map(fn ($item): array => [
                    'id' => $item->id,
                    'product_name' => $item->product_name,
                    'unit_price' => (float) $item->unit_price,
                    'quantity' => $item->quantity,
                    'line_total' => (float) $item->line_total,
                ]),
                'latest_payment' => $invoice->latestPayment ? [
                    'id' => $invoice->latestPayment->id,
                    'status' => $invoice->latestPayment->status,
                    'gateway_track_id' => $invoice->latestPayment->gateway_track_id,
                    'gateway_ref_number' => $invoice->latestPayment->gateway_ref_number,
                ] : null,
            ],
        ]);
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
                    (string) ($invoice->postal_code ?? ''),
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
