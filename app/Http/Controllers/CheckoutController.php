<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class CheckoutController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $items = $request->user()
            ->cartItems()
            ->with('product:id,title')
            ->get();

        if ($items->isEmpty()) {
            return back()->withErrors(['cart' => 'Your cart is empty.']);
        }

        $invoice = DB::transaction(function () use ($request, $items) {
            $total = $items->sum(fn ($item) => $item->quantity * (float) $item->unit_price);

            $invoice = $request->user()->invoices()->create([
                'total' => $total,
                'status' => 'pending_payment',
                'payment_reference' => null,
            ]);

            $invoice->items()->createMany(
                $items->map(fn ($item) => [
                    'product_id' => $item->product_id,
                    'product_name' => $item->product->title ?? 'Deleted Product',
                    'unit_price' => $item->unit_price,
                    'quantity' => $item->quantity,
                    'line_total' => $item->quantity * (float) $item->unit_price,
                ])->all()
            );

            $request->user()->cartItems()->delete();

            return $invoice;
        });

        return redirect()->route('invoices.show', $invoice)->with('success', 'Invoice created. Payment integration is pending.');
    }

    public function show(Request $request, Invoice $invoice): Response
    {
        abort_if($invoice->user_id !== $request->user()->id, 403);

        $invoice->load('items');

        return Inertia::render('Invoices/Show', [
            'invoice' => $invoice,
        ]);
    }
}
