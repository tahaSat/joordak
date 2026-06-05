<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use App\Support\LiaraUrl;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(): Response
    {
        $query = Product::query()
            ->with('category:id,name,slug')
            ->where('is_active', true);

        $selectedCategory = null;
        if (request()->has('category')) {
            $selectedCategory = Category::query()
                ->where('slug', request('category'))
                ->first(['id', 'name', 'slug']);

            if ($selectedCategory) {
                $query->where('category_id', $selectedCategory->id);
            }
        }

        $products = $query
            ->latest('id')
            ->paginate(12)
            ->withQueryString();

        $products->through(function (Product $product) {
            if ($product->image_url) {
                $product->image_url = LiaraUrl::fromPath($product->image_url);
            }

            return $product;
        });

        $categories = Category::query()
            ->orderBy('name')
            ->get(['id', 'name', 'slug']);

        return Inertia::render('Products/Index', [
            'products' => $products,
            'categories' => $categories,
            'cartItems' => $this->cartItems(),
            'selectedCategory' => $selectedCategory,
        ]);
    }

    public function show(Product $product): Response
    {
        abort_unless($product->is_active, 404);

        $product->load('category:id,name,slug');

        $coverImageUrl = LiaraUrl::fromPath($product->image_url);
        $galleryImages = collect([$coverImageUrl])
            ->merge(collect($product->photo_urls ?? [])->map(fn (?string $path) => LiaraUrl::fromPath($path)))
            ->filter()
            ->values()
            ->all();

        $product->image_url = $coverImageUrl;
        $product->photo_urls = $galleryImages;

        return Inertia::render('Products/Show', [
            'product' => $product,
            'galleryImages' => $galleryImages ?: ['/logo.svg'],
            'cartItems' => $this->cartItems(),
        ]);
    }

    private function cartItems(): array
    {
        if (! auth()->check()) {
            return [];
        }

        return auth()->user()->cartItems()
            ->get(['id', 'product_id', 'quantity'])
            ->mapWithKeys(function ($item) {
                return [$item->product_id => ['quantity' => $item->quantity, 'cart_item_id' => $item->id]];
            })
            ->toArray();
    }
}
