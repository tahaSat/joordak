<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BlogPost;
use App\Models\Category;
use App\Models\Invoice;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        Gate::authorize('viewAny', Invoice::class);

        return Inertia::render('Admin/Dashboard/Index', [
            'stats' => [
                'products' => Product::query()->count(),
                'categories' => Category::query()->count(),
                'blogPosts' => BlogPost::query()->count(),
                'users' => User::query()->count(),
                'invoices' => Invoice::query()->count(),
                'revenue' => (float) Invoice::query()->whereIn('status', ['paid', 'delivered_to_post'])->sum('total'),
            ],
            'recentInvoices' => Invoice::query()
                ->with('user')
                ->latest()
                ->take(5)
                ->get()
                ->map(fn (Invoice $invoice): array => $this->invoiceSummary($invoice)),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function invoiceSummary(Invoice $invoice): array
    {
        return [
            'id' => $invoice->id,
            'status' => $invoice->status->value,
            'total' => (float) $invoice->total,
            'created_at' => $invoice->created_at?->toISOString(),
            'customer_name' => trim(($invoice->user?->name ?? '').' '.($invoice->user?->surname ?? '')),
            'customer_phone' => $invoice->user?->phone,
        ];
    }
}
