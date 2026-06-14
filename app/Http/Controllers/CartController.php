<?php

namespace App\Http\Controllers;

use App\Models\CartItem;
use App\Models\Product;
use App\Models\SubProduct;
use App\Services\DiscountService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CartController extends Controller
{
    public function __construct(private readonly DiscountService $discounts)
    {
    }

    public function index(Request $request): Response
    {
        $items = $request->user()
            ->cartItems()
            ->with(['product:id,title,slug,image_url,is_active', 'subProduct'])
            ->latest('id')
            ->get();

        $serialized = $items->map(function (CartItem $item): array {
            $subProduct = $item->subProduct;
            $pricing = $subProduct
                ? $this->discounts->effectiveVariantPrice($subProduct)
                : ['original' => (int) $item->unit_price, 'discounted' => (int) $item->unit_price, 'reduction' => 0];

            return [
                'id' => $item->id,
                'quantity' => $item->quantity,
                'product' => $item->product ? [
                    'title' => $item->product->title,
                ] : null,
                'sub_product' => $subProduct ? [
                    'size' => $subProduct->size,
                    'color_name' => $subProduct->color_name,
                    'color_hex' => $subProduct->color_hex,
                    'stock' => $subProduct->stock,
                ] : null,
                'original_unit_price' => $pricing['original'],
                'unit_price' => $pricing['discounted'],
                'discount_amount' => $pricing['reduction'],
                'line_total' => $pricing['discounted'] * $item->quantity,
                'line_original_total' => $pricing['original'] * $item->quantity,
            ];
        });

        $grossSubtotal = (int) $serialized->sum('line_original_total');
        $subtotal = (int) $serialized->sum('line_total');
        $productDiscountTotal = max(0, $grossSubtotal - $subtotal);

        $appliedCode = $this->discounts->findUsableCode($request->session()->get(DiscountService::CART_SESSION_KEY));
        $invoiceDiscount = $appliedCode ? $appliedCode->computeDiscount($subtotal) : 0;

        if ($appliedCode && $invoiceDiscount <= 0) {
            $appliedCode = null;
            $request->session()->forget(DiscountService::CART_SESSION_KEY);
        }

        return Inertia::render('Cart/Index', [
            'items' => $serialized,
            'summary' => [
                'gross_subtotal' => $grossSubtotal,
                'product_discount_total' => $productDiscountTotal,
                'subtotal' => $subtotal,
                'invoice_discount_amount' => $invoiceDiscount,
                'total' => max(0, $subtotal - $invoiceDiscount),
            ],
            'appliedCoupon' => $appliedCode ? [
                'code' => $appliedCode->code,
                'amount' => $invoiceDiscount,
            ] : null,
        ]);
    }

    public function applyCoupon(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:255'],
        ]);

        $subtotal = $this->cartSubtotal($request);

        $result = $this->discounts->validateCode($validated['code'], $subtotal);

        if (! $result['ok']) {
            return back()->withErrors(['code' => $result['message']]);
        }

        $request->session()->put(DiscountService::CART_SESSION_KEY, $result['code']->code);

        return back()->with('success', 'کد تخفیف اعمال شد.');
    }

    public function removeCoupon(Request $request): RedirectResponse
    {
        $request->session()->forget(DiscountService::CART_SESSION_KEY);

        return back()->with('success', 'کد تخفیف حذف شد.');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'product_id' => ['nullable', 'exists:products,id'],
            'sub_product_id' => ['nullable', 'exists:sub_products,id'],
            'quantity' => ['nullable', 'integer', 'min:1', 'max:20'],
        ]);

        $subProduct = $this->resolveSubProduct($validated);
        $product = $subProduct->product;

        $quantity = $validated['quantity'] ?? 1;

        $item = CartItem::query()->firstOrNew([
            'user_id' => $request->user()->id,
            'product_id' => $product->id,
            'sub_product_id' => $subProduct->id,
        ]);

        $newQuantity = $item->exists ? $item->quantity + $quantity : $quantity;

        // Check stock availability
        if ($newQuantity > $subProduct->stock) {
            return back()->withErrors(['stock' => 'موجودی محصول کافی نیست']);
        }

        $item->quantity = min(20, $newQuantity);
        $item->unit_price = $subProduct->price;
        $item->save();

        return back()->with('success', 'محصول به سبد خرید اضافه شد.');
    }

    public function update(Request $request, int $cartItem): RedirectResponse
    {
        $item = CartItem::query()
            ->where('id', $cartItem)
            ->where('user_id', $request->user()->id)
            ->first();

        if (! $item) {
            return back();
        }

        $validated = $request->validate([
            'quantity' => ['required', 'integer', 'min:1', 'max:20'],
        ]);

        // Check stock availability
        $subProduct = $item->subProduct;
        if (! $subProduct || $validated['quantity'] > $subProduct->stock) {
            return back()->withErrors(['stock' => 'موجودی محصول کافی نیست']);
        }

        $item->update([
            'quantity' => $validated['quantity'],
        ]);

        return back()->with('success', 'آیتم سبد خرید به‌روزرسانی شد.');
    }

    public function destroy(Request $request, int $cartItem): RedirectResponse
    {
        CartItem::query()
            ->where('id', $cartItem)
            ->where('user_id', $request->user()->id)
            ->delete();

        return back()->with('success', 'Cart item removed.');
    }

    private function cartSubtotal(Request $request): int
    {
        $items = $request->user()
            ->cartItems()
            ->with('subProduct')
            ->get();

        return (int) $items->sum(function (CartItem $item): int {
            $subProduct = $item->subProduct;
            $unit = $subProduct
                ? $this->discounts->effectiveVariantPrice($subProduct)['discounted']
                : (int) $item->unit_price;

            return $unit * $item->quantity;
        });
    }

    /**
     * @param array<string, mixed> $validated
     */
    private function resolveSubProduct(array $validated): SubProduct
    {
        if (! empty($validated['sub_product_id'])) {
            return SubProduct::query()
                ->whereHas('product', fn ($query) => $query->where('is_active', true))
                ->with('product')
                ->findOrFail($validated['sub_product_id']);
        }

        abort_unless(! empty($validated['product_id']), 422, 'A product variant is required.');

        $product = Product::query()
            ->where('is_active', true)
            ->with('subProducts')
            ->findOrFail($validated['product_id']);

        $subProduct = $product->subProducts->first();

        abort_unless($subProduct, 422, 'A product variant is required.');

        return $subProduct->load('product');
    }
}
