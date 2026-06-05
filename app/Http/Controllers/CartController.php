<?php

namespace App\Http\Controllers;

use App\Models\CartItem;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CartController extends Controller
{
    public function index(Request $request): Response
    {
        $items = $request->user()
            ->cartItems()
            ->with('product:id,title,slug,image_url,is_active,stock')
            ->latest('id')
            ->get();

        $total = $items->sum(fn (CartItem $item) => $item->quantity * (float) $item->unit_price);

        return Inertia::render('Cart/Index', [
            'items' => $items,
            'total' => number_format($total, 2, '.', ''),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
            'quantity' => ['nullable', 'integer', 'min:1', 'max:20'],
        ]);

        $product = Product::query()->where('is_active', true)->findOrFail($validated['product_id']);

        $quantity = $validated['quantity'] ?? 1;

        $item = CartItem::query()->firstOrNew([
            'user_id' => $request->user()->id,
            'product_id' => $product->id,
        ]);

        $newQuantity = $item->exists ? $item->quantity + $quantity : $quantity;

        // Check stock availability
        if ($newQuantity > $product->stock) {
            return back()->withErrors(['stock' => 'موجودی محصول کافی نیست']);
        }

        $item->quantity = min(20, $newQuantity);
        $item->unit_price = $product->price;
        $item->save();

        return back()->with('success', 'محصول به سبد خرید اضافه شد.');
    }

    public function update(Request $request, CartItem $cartItem): RedirectResponse
    {
        abort_if($cartItem->user_id !== $request->user()->id, 403);

        $validated = $request->validate([
            'quantity' => ['required', 'integer', 'min:1', 'max:20'],
        ]);

        // Check stock availability
        $product = $cartItem->product;
        if ($validated['quantity'] > $product->stock) {
            return back()->withErrors(['stock' => 'موجودی محصول کافی نیست']);
        }

        $cartItem->update([
            'quantity' => $validated['quantity'],
        ]);

        return back()->with('success', 'آیتم سبد خرید به‌روزرسانی شد.');
    }

    public function destroy(Request $request, CartItem $cartItem): RedirectResponse
    {
        abort_if($cartItem->user_id !== $request->user()->id, 403);

        $cartItem->delete();

        return back()->with('success', 'Cart item removed.');
    }
}
