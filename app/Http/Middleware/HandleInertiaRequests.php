<?php

namespace App\Http\Middleware;

use App\Enums\InvoiceStatus;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
            'cartCount' => $request->user()?->cartItems()->count() ?? 0,
            'pendingPaymentInvoicesCount' => $request->user()
                ?->invoices()
                ->where('status', InvoiceStatus::PendingPayment)
                ->count() ?? 0,
            'flash' => [
                'status' => fn () => $request->session()->get('status'),
                'success' => fn () => $request->session()->get('success'),
                'shared_cart_url' => fn () => $request->session()->get('shared_cart_url'),
                'payment_track_id' => fn () => $request->session()->get('payment_track_id'),
            ],
        ];
    }
}
