<?php

namespace App\Http\Controllers;

use App\Enums\InvoiceStatus;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PaymentHistoryController extends Controller
{
    public function index(Request $request): Response
    {
        $pendingOnly = $request->boolean('pending_only');

        $invoices = $request->user()
            ->invoices()
            ->with(['items', 'latestPayment'])
            ->when($pendingOnly, fn ($query) => $query->where('status', InvoiceStatus::PendingPayment))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('PaymentHistory/Index', [
            'invoices' => $invoices,
            'filters' => [
                'pending_only' => $pendingOnly,
            ],
        ]);
    }
}
