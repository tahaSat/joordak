<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use App\Models\SubProduct;
use App\Support\LiaraUrl;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(): Response
    {
        $query = Product::query()
            ->with(['category:id,name,slug', 'subProducts'])
            ->where('is_active', true);

        $selectedCategory = null;
        $showDiscountedOnly = request()->boolean('discounted');

        if (request()->has('category')) {
            $selectedCategory = Category::query()
                ->where('slug', request('category'))
                ->first(['id', 'name', 'slug']);

            if ($selectedCategory) {
                $query->where('category_id', $selectedCategory->id);
            }
        }

        if ($showDiscountedOnly) {
            $query->whereHas('subProducts', fn ($subProductQuery) => $subProductQuery->withActiveDiscount());
        }

        $products = $query
            ->inStockFirst()
            ->latest('id')
            ->paginate(10)
            ->withQueryString();

        $products->through(fn (Product $product): array => $this->serializeProductCard($product));

        $categories = Category::query()
            ->whereHas('products', fn ($productQuery) => $productQuery->where('is_active', true))
            ->orderBy('name')
            ->get(['id', 'name', 'slug']);

        return Inertia::render('Products/Index', [
            'products' => $products,
            'categories' => $categories,
            'cartItems' => $this->cartItems(),
            'selectedCategory' => $selectedCategory,
            'showDiscountedOnly' => $showDiscountedOnly,
        ]);
    }

    public function show(Product $product): Response
    {
        $product->load(['category:id,name,slug', 'subProducts']);

        $coverImageUrl = LiaraUrl::fromPath($product->image_url);
        $firstSubProduct = $product->subProducts->first();
        $galleryImages = collect([$coverImageUrl])
            ->merge(collect($firstSubProduct?->photo_urls ?? [])->map(fn (?string $path) => LiaraUrl::fromPath($path)))
            ->filter()
            ->values()
            ->all();

        return Inertia::render('Products/Show', [
            'product' => $this->serializeProductDetail($product),
            'galleryImages' => $galleryImages ?: ['/logo.png'],
            'cartItems' => $this->cartItems(),
        ]);
    }

    private function cartItems(): array
    {
        if (! auth()->check()) {
            return [];
        }

        return auth()->user()->cartItems()
            ->get(['id', 'sub_product_id', 'quantity'])
            ->mapWithKeys(function ($item) {
                return [$item->sub_product_id => ['quantity' => $item->quantity, 'cart_item_id' => $item->id]];
            })
            ->toArray();
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeProductCard(Product $product): array
    {
        $product->loadMissing(['category', 'subProducts']);
        $subProduct = $product->subProducts->first(fn (SubProduct $variant): bool => $variant->hasActiveDiscount())
            ?? $product->subProducts->first();
        $sizeCount = $product->subProducts->pluck('size')->filter()->unique()->count();
        $colorCount = $product->subProducts->pluck('color_name')->filter()->unique()->count();

        return [
            'id' => $product->id,
            'title' => $product->title,
            'slug' => $product->slug,
            'excerpt' => $product->excerpt,
            'is_active' => $product->is_active,
            'price' => $subProduct?->price ?? 0,
            'discounted_price' => $subProduct ? $subProduct->discountedPrice() : 0,
            'has_discount' => (bool) $subProduct?->hasActiveDiscount(),
            'stock' => $subProduct?->stock ?? 0,
            'image_url' => LiaraUrl::fromPath($product->image_url),
            'size' => $subProduct?->size,
            'color_name' => $subProduct?->color_name,
            'color_hex' => $subProduct?->color_hex,
            'size_count' => $sizeCount,
            'color_count' => $colorCount,
            'sub_product_id' => $subProduct?->id,
            'category_id' => $product->category_id,
            'category' => $product->category,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeProductDetail(Product $product): array
    {
        $card = $this->serializeProductCard($product);

        return [
            ...$card,
            'description' => $product->description,
            'subproducts' => $product->subProducts
                ->map(fn (SubProduct $subProduct): array => [
                    'id' => $subProduct->id,
                    'price' => $subProduct->price,
                    'discounted_price' => $subProduct->discountedPrice(),
                    'has_discount' => $subProduct->hasActiveDiscount(),
                    'stock' => $subProduct->stock,
                    'size' => $subProduct->size,
                    'color_name' => $subProduct->color_name,
                    'color_hex' => $subProduct->color_hex,
                    'photo_urls' => collect($subProduct->photo_urls ?? [])
                        ->map(fn (?string $path): ?string => LiaraUrl::fromPath($path))
                        ->filter()
                        ->values()
                        ->all(),
                ])
                ->values()
                ->all(),
        ];
    }
}
