<?php

use App\Http\Controllers\BlogController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\HomeBannerController;
use App\Http\Controllers\PaymentHistoryController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProfileController;
use App\Models\BlogPost;
use App\Models\Product;
use App\Support\LiaraUrl;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

Route::get('/', function () {
    $featuredProducts = Product::query()
        ->where('is_active', true)
        ->latest('id')
        ->take(3)
        ->get()
        ->map(function (Product $product) {
            if ($product->image_url) {
                $product->image_url = LiaraUrl::fromPath($product->image_url);
            }

            return $product;
        });

    $recentPosts = BlogPost::query()
        ->published()
        ->latest('published_at')
        ->take(3)
        ->get()
        ->map(function (BlogPost $post) {
            if ($post->image_url) {
                $post->image_url = LiaraUrl::fromPath($post->image_url);
            }

            return $post;
        });

    $cartItems = [];
    if (auth()->check()) {
        $cartItems = auth()->user()->cartItems()
            ->get(['id', 'product_id', 'quantity'])
            ->mapWithKeys(function ($item) {
                return [$item->product_id => ['quantity' => $item->quantity, 'cart_item_id' => $item->id]];
            })
            ->toArray();
    }

    $heroImageUrl = app(HomeBannerController::class)->temporaryUrl();

    return Inertia::render('Welcome', [
        'featuredProducts' => $featuredProducts,
        'recentPosts' => $recentPosts,
        'cartItems' => $cartItems,
        'heroImageUrl' => $heroImageUrl,
    ]);
})->name('landing');

Route::get('/products', [ProductController::class, 'index'])->name('products.index');
Route::get('/products/{product:slug}', [ProductController::class, 'show'])->name('products.show');
Route::get('/blog', [BlogController::class, 'index'])->name('blog.index');
Route::get('/home-banner/image', [HomeBannerController::class, 'image'])->name('home-banner.image');
Route::get('/sitemap.xml', function () {
    $urls = collect([
        [route('landing'), now()],
        [route('products.index'), now()],
        [route('blog.index'), now()],
    ]);

    Product::query()
        ->where('is_active', true)
        ->get(['slug', 'updated_at'])
        ->each(fn (Product $product) => $urls->push([
            route('products.show', $product->slug),
            $product->updated_at,
        ]));

    \App\Models\Category::query()
        ->get(['slug', 'updated_at'])
        ->each(fn (\App\Models\Category $category) => $urls->push([
            route('products.index', ['category' => $category->slug]),
            $category->updated_at,
        ]));

    $xml = view('sitemap', ['urls' => $urls])->render();

    return response($xml, 200)->header('Content-Type', 'application/xml');
})->name('sitemap');
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', function () {
        $invoices = auth()->user()->invoices()->with('items')->latest()->get();
        return Inertia::render('Dashboard', [
            'invoices' => $invoices,
        ]);
    })->name('dashboard');

    Route::get('/payment-history', [PaymentHistoryController::class, 'index'])->name('payment-history.index');

    Route::get('/cart', [CartController::class, 'index'])->name('cart.index');
    Route::post('/cart', [CartController::class, 'store'])->name('cart.store');
    Route::patch('/cart/{cartItem}', [CartController::class, 'update'])->name('cart.update');
    Route::delete('/cart/{cartItem}', [CartController::class, 'destroy'])->name('cart.destroy');

    Route::post('/checkout', [CheckoutController::class, 'store'])->name('checkout.store');
    Route::get('/invoices/{invoice}', [CheckoutController::class, 'show'])->name('invoices.show');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
