<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use Inertia\Inertia;
use Inertia\Response;

class PaymentHistoryController extends Controller
{
    public function index(): Response
    {
        $invoices = auth()->user()
            ->invoices()
            ->with('items')
            ->latest()
            ->get();

        return Inertia::render('PaymentHistory/Index', [
            'invoices' => $invoices,
        ]);
    }
}
