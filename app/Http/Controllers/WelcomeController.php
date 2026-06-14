<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use App\Models\Setting;
use App\Support\LiaraUrl;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class WelcomeController extends Controller
{
    public function __construct(
        private HomeBannerController $homeBanner,
    ) {}

    public function __invoke(): Response
    {
        return Inertia::render('Welcome', [
            'featuredProducts' => $this->featuredProducts(),
            'categories' => $this->categories(),
            'cartItems' => $this->cartItems(),
            'heroImageUrl' => $this->homeBanner->temporaryUrl(),
            'heroTitle' => Setting::getValue('hero_title', 'به جردک خوش آمدید'),
            'heroSubtitle' => Setting::getValue('hero_subtitle', 'فروشگاه آنلاین مد و پوشاک'),
        ]);
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function featuredProducts(): Collection
    {
        if (! Schema::hasTable('products')) {
            return collect();
        }

        return Product::query()
            ->with('subProducts')
            ->where('is_active', true)
            ->inStockFirst()
            ->latest('id')
            ->take(10)
            ->get()
            ->map(function (Product $product): array {
                $subProduct = $product->subProducts->first();
                $sizeCount = $product->subProducts->pluck('size')->filter()->unique()->count();
                $colorCount = $product->subProducts->pluck('color_name')->filter()->unique()->count();

                return [
                    'id' => $product->id,
                    'title' => $product->title,
                    'slug' => $product->slug,
                    'excerpt' => $product->excerpt,
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
                ];
            });
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function categories(): Collection
    {
        if (! Schema::hasTable('categories')) {
            return collect();
        }

        return Category::query()
            ->whereHas('products', fn ($query) => $query->where('is_active', true))
            ->withCount(['products' => fn ($query) => $query->where('is_active', true)])
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'image_url'])
            ->map(fn (Category $category): array => [
                'id' => $category->id,
                'name' => $category->name,
                'slug' => $category->slug,
                'image_url' => LiaraUrl::fromPath($category->image_url),
                'products_count' => $category->products_count,
            ]);
    }

    /**
     * @return array<int, array{quantity: int, cart_item_id: int}>
     */
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
}
