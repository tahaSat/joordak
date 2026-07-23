<?php

use App\Http\Controllers\BlogController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\Admin\BlogPostController as AdminBlogPostController;
use App\Http\Controllers\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\DiscountCodeController as AdminDiscountCodeController;
use App\Http\Controllers\Admin\InvoiceController as AdminInvoiceController;
use App\Http\Controllers\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Admin\SettingsController as AdminSettingsController;
use App\Http\Controllers\Admin\SlugController as AdminSlugController;
use App\Http\Controllers\Admin\StatsController as AdminStatsController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\AboutUsController;
use App\Http\Controllers\HomeBannerController;
use App\Http\Controllers\PaymentHistoryController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SharedCartController;
use App\Http\Controllers\WelcomeController;
use App\Http\Controllers\ZibalPaymentController;
use App\Models\Category;
use App\Models\Product;
use App\Support\AboutUsSeo;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', WelcomeController::class)->name('landing');

Route::get('/products', [ProductController::class, 'index'])->name('products.index');
Route::get('/products/{product:slug}', [ProductController::class, 'show'])->name('products.show');
Route::get('/blog', [BlogController::class, 'index'])->name('blog.index');
Route::get('/about-us', [AboutUsController::class, 'show'])->name('about-us');
Route::get('/home-banner/image', [HomeBannerController::class, 'image'])->name('home-banner.image');
Route::get('/about-us-cover/image', [AboutUsController::class, 'coverImage'])->name('about-us-cover.image');
Route::get('/sitemap.xml', function () {
    $aboutLastmod = AboutUsSeo::contentLastModified();
    $aboutPriority = AboutUsSeo::hasContent() ? '0.7' : '0.5';

    $urls = collect([
        [route('landing'), now(), 'daily', '1.0'],
        [route('products.index'), now(), 'daily', '0.9'],
        [route('blog.index'), now(), 'weekly', '0.8'],
        [route('about-us'), $aboutLastmod, AboutUsSeo::hasContent() ? 'monthly' : 'yearly', $aboutPriority],
    ]);

    Product::query()
        ->where('is_active', true)
        ->get(['slug', 'updated_at'])
        ->each(fn (Product $product) => $urls->push([
            route('products.show', $product->slug),
            $product->updated_at,
            'weekly',
            '0.8',
        ]));

    Category::query()
        ->get(['slug', 'updated_at'])
        ->each(fn (Category $category) => $urls->push([
            route('products.index', ['category' => $category->slug]),
            $category->updated_at,
            'weekly',
            '0.7',
        ]));

    $xml = view('sitemap', ['urls' => $urls])->render();

    return response($xml, 200)->header('Content-Type', 'application/xml');
})->name('sitemap');
Route::match(['get', 'post'], '/payments/zibal/callback', [ZibalPaymentController::class, 'callback'])
    ->name('payments.zibal.callback');
Route::post('/payments/zibal/success/{invoice}', [ZibalPaymentController::class, 'successCallback'])
    ->name('payments.zibal.success.callback');

Route::prefix('admin')
    ->name('admin.')
    ->middleware(['auth', 'verified', 'admin'])
    ->group(function () {
        Route::get('/', AdminDashboardController::class)->name('dashboard');
        Route::get('/stats', AdminStatsController::class)->name('stats');
        Route::post('/slugs', AdminSlugController::class)->name('slugs.store');

        Route::post('/products/images', [AdminProductController::class, 'uploadImages'])->name('products.images.store');
        Route::get('/products/images/{uploadId}', [AdminProductController::class, 'imageUploadStatus'])->name('products.images.show');
        Route::delete('/products/images', [AdminProductController::class, 'deleteImage'])->name('products.images.destroy');
        Route::resource('products', AdminProductController::class)->except(['show']);
        Route::post('/products/slug', [AdminProductController::class, 'slug'])->name('products.slug');
        Route::post('/categories/image', [AdminCategoryController::class, 'uploadImage'])->name('categories.image.store');
        Route::get('/categories/image/{uploadId}', [AdminCategoryController::class, 'imageUploadStatus'])->name('categories.image.show');
        Route::delete('/categories/image', [AdminCategoryController::class, 'deleteImage'])->name('categories.image.destroy');
        Route::resource('categories', AdminCategoryController::class)->except(['show']);
        Route::resource('blog-posts', AdminBlogPostController::class)->except(['show']);
        Route::resource('discount-codes', AdminDiscountCodeController::class)->except(['show']);
        Route::resource('users', AdminUserController::class)->except(['show']);

        Route::post('/shared-carts', [SharedCartController::class, 'store'])->name('shared-carts.store');

        Route::get('/invoices', [AdminInvoiceController::class, 'index'])->name('invoices.index');
        Route::get('/invoices/export', [AdminInvoiceController::class, 'export'])->name('invoices.export');
        Route::get('/invoices/{invoice}', [AdminInvoiceController::class, 'show'])->name('invoices.show');
        Route::post('/invoices/{invoice}/cancel', [AdminInvoiceController::class, 'cancel'])->name('invoices.cancel');
        Route::post('/invoices/{invoice}/deliver-to-post', [AdminInvoiceController::class, 'deliverToPost'])->name('invoices.deliver-to-post');

        Route::get('/settings', [AdminSettingsController::class, 'edit'])->name('settings.edit');
        Route::post('/settings/image', [AdminSettingsController::class, 'upload'])->name('settings.image.store');
        Route::get('/settings/image/{uploadId}', [AdminSettingsController::class, 'uploadStatus'])->name('settings.image.show');
        Route::delete('/settings/image', [AdminSettingsController::class, 'delete'])->name('settings.image.destroy');
        Route::post('/settings/about-cover', [AdminSettingsController::class, 'uploadAboutCover'])->name('settings.about-cover.store');
        Route::get('/settings/about-cover/{uploadId}', [AdminSettingsController::class, 'aboutCoverUploadStatus'])->name('settings.about-cover.show');
        Route::delete('/settings/about-cover', [AdminSettingsController::class, 'deleteAboutCover'])->name('settings.about-cover.destroy');
        Route::post('/settings', [AdminSettingsController::class, 'update'])->name('settings.update');
    });

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', function () {
        $invoices = auth()->user()->invoices()->with(['items', 'latestPayment'])->latest()->get();

        return Inertia::render('Dashboard', [
            'invoices' => $invoices,
        ]);
    })->name('dashboard');

    Route::get('/payment-history', [PaymentHistoryController::class, 'index'])->name('payment-history.index');
    Route::get('/payments/zibal/success/{invoice}', [ZibalPaymentController::class, 'success'])->name('payments.zibal.success');

    Route::get('/cart', [CartController::class, 'index'])->name('cart.index');
    Route::post('/cart', [CartController::class, 'store'])->name('cart.store');
    Route::post('/cart/coupon', [CartController::class, 'applyCoupon'])->name('cart.coupon.store');
    Route::delete('/cart/coupon', [CartController::class, 'removeCoupon'])->name('cart.coupon.destroy');
    Route::patch('/cart/{cartItem}', [CartController::class, 'update'])->name('cart.update');
    Route::delete('/cart/{cartItem}', [CartController::class, 'destroy'])->name('cart.destroy');

    Route::get('/shared-carts/{sharedCart}', [SharedCartController::class, 'show'])->name('shared-carts.show');

    Route::post('/checkout', [CheckoutController::class, 'store'])->name('checkout.store');
    Route::get('/invoices/{invoice}', [CheckoutController::class, 'show'])->name('invoices.show');
    Route::post('/invoices/{invoice}/discount', [CheckoutController::class, 'applyDiscount'])->name('invoices.discount.store');
    Route::delete('/invoices/{invoice}/discount', [CheckoutController::class, 'removeDiscount'])->name('invoices.discount.destroy');
    Route::get('/invoices/{invoice}/pay', [ZibalPaymentController::class, 'pay'])->name('invoices.pay');
    Route::post('/invoices/{invoice}/pay/start', [ZibalPaymentController::class, 'start'])->name('invoices.pay.start');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
