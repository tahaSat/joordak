<?php

namespace App\Http\Controllers;

use App\Models\CartItem;
use App\Models\SharedCart;
use App\Models\SharedCartItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SharedCartController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        abort_unless($request->user()?->isAdmin(), 403);

        $items = $request->user()
            ->cartItems()
            ->with(['product', 'subProduct'])
            ->get();

        if ($items->isEmpty()) {
            return back()->withErrors(['shared_cart' => 'سبد خرید برای اشتراک‌گذاری خالی است.']);
        }

        foreach ($items as $item) {
            if (! $this->canShareItem($item)) {
                return back()->withErrors([
                    'shared_cart' => 'برخی محصولات این سبد خرید دیگر موجود نیستند.',
                ]);
            }
        }

        $sharedCart = DB::transaction(function () use ($items, $request): SharedCart {
            $sharedCart = SharedCart::query()->create([
                'created_by_user_id' => $request->user()->id,
                'token' => $this->uniqueToken(),
            ]);

            foreach ($items as $item) {
                $sharedCart->items()->create([
                    'product_id' => $item->product_id,
                    'sub_product_id' => $item->sub_product_id,
                    'quantity' => $item->quantity,
                    'unit_price' => $item->unit_price,
                ]);
            }

            $request->user()->cartItems()->delete();

            return $sharedCart;
        });

        return back()
            ->with('success', 'لینک سبد خرید ساخته شد.')
            ->with('shared_cart_url', route('shared-carts.show', $sharedCart));
    }

    public function show(Request $request, SharedCart $sharedCart): RedirectResponse
    {
        $sharedCart->load(['items.product', 'items.subProduct.product']);

        if ($sharedCart->items->isEmpty()) {
            return redirect()->route('cart.index')->withErrors([
                'shared_cart' => 'این سبد خرید اشتراکی خالی است.',
            ]);
        }

        foreach ($sharedCart->items as $item) {
            if (! $this->canCopyItem($item)) {
                return redirect()->route('cart.index')->withErrors([
                    'shared_cart' => 'برخی محصولات این سبد خرید دیگر موجود نیستند.',
                ]);
            }
        }

        DB::transaction(function () use ($request, $sharedCart): void {
            $request->user()->cartItems()->delete();

            foreach ($sharedCart->items as $item) {
                $request->user()->cartItems()->create([
                    'product_id' => $item->product_id,
                    'sub_product_id' => $item->sub_product_id,
                    'quantity' => $item->quantity,
                    'unit_price' => $item->unit_price,
                ]);
            }

            $sharedCart->increment('claimed_count');
        });

        return redirect()
            ->route('cart.index')
            ->with('success', 'سبد خرید اشتراکی برای شما آماده شد.');
    }

    private function canCopyItem(SharedCartItem $item): bool
    {
        return (bool) $item->product?->is_active
            && $item->subProduct !== null
            && $item->subProduct->product_id === $item->product_id
            && $item->subProduct->stock >= $item->quantity;
    }

    private function canShareItem(CartItem $item): bool
    {
        return (bool) $item->product?->is_active
            && $item->subProduct !== null
            && $item->subProduct->product_id === $item->product_id
            && $item->subProduct->stock >= $item->quantity;
    }

    private function uniqueToken(): string
    {
        do {
            $token = Str::random(48);
        } while (SharedCart::query()->where('token', $token)->exists());

        return $token;
    }
}
