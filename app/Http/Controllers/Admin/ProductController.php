<?php

namespace App\Http\Controllers\Admin;

use App\Enums\DiscountType;
use App\Http\Controllers\Controller;
use App\Jobs\DeleteLiaraFile;
use App\Jobs\UploadProductImageToLiara;
use App\Models\Category;
use App\Models\Product;
use App\Models\SubProduct;
use App\Support\LiaraUrl;
use App\Support\SlugGenerator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Product::class);

        $filters = $request->only(['search']);

        $products = Product::query()
            ->with(['category', 'subProducts'])
            ->when($filters['search'] ?? null, function (Builder $query, string $search): void {
                $query->where('title', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%")
                    ->orWhere('excerpt', 'like', "%{$search}%")
                    ->orWhereHas('category', fn (Builder $query): Builder => $query->where('name', 'like', "%{$search}%"));
            })
            ->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Product $product): array => $this->serialize($product));

        return Inertia::render('Admin/Products/Index', [
            'products' => $products,
            'filters' => $filters,
        ]);
    }

    public function create(): Response
    {
        Gate::authorize('create', Product::class);

        return Inertia::render('Admin/Products/Form', [
            'product' => null,
            'categories' => $this->categoryOptions(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('create', Product::class);

        $data = $this->validated($request);

        DB::transaction(function () use ($data): void {
            $subProducts = $data['subproducts'];
            unset($data['subproducts']);

            $product = Product::query()->create($data);
            $this->syncSubProducts($product, $subProducts);
        });

        return redirect()->route('admin.products.index')->with('status', 'محصول با موفقیت اضافه شد');
    }

    public function edit(Product $product): Response
    {
        Gate::authorize('update', $product);
        $product->load(['category', 'subProducts']);

        return Inertia::render('Admin/Products/Form', [
            'product' => $this->serialize($product),
            'categories' => $this->categoryOptions(),
        ]);
    }

    public function update(Request $request, Product $product): RedirectResponse
    {
        Gate::authorize('update', $product);

        $data = $this->validated($request, $product);

        DB::transaction(function () use ($product, $data): void {
            $subProducts = $data['subproducts'];
            unset($data['subproducts']);

            $product->update($data);
            $this->syncSubProducts($product, $subProducts);
        });

        return redirect()->route('admin.products.index')->with('status', 'محصول با موفقیت اضافه شد');
    }

    public function destroy(Product $product): RedirectResponse
    {
        Gate::authorize('delete', $product);

        $product->delete();

        return redirect()->route('admin.products.index')->with('status', 'محصول حذف شد.');
    }

    public function slug(Request $request): array
    {
        Gate::authorize('create', Product::class);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
        ]);

        return ['slug' => SlugGenerator::fromTitle($data['title'])];
    }

    /**
     * @return array{uploads: array<int, array{id: string, status: string}>}
     */
    public function uploadImages(Request $request): array
    {
        Gate::authorize('create', Product::class);

        $data = $request->validate([
            'type' => ['required', Rule::in(['cover', 'gallery'])],
            'images' => ['required', 'array', 'min:1'],
            'images.*' => ['required', 'image', 'max:5120'],
        ]);

        $directory = $data['type'] === 'cover' ? 'products' : 'products/gallery';

        return [
            'uploads' => collect($request->file('images', []))
                ->map(function ($file) use ($directory): array {
                    $uploadId = (string) Str::uuid();
                    $extension = $file->extension() ?: 'jpg';
                    $tempPath = $file->storeAs('admin-product-image-uploads', "{$uploadId}.{$extension}", 'local');
                    $destinationPath = "{$directory}/{$uploadId}.{$extension}";

                    abort_if($tempPath === false, 500, 'Unable to queue product image upload.');

                    Cache::put($this->uploadCacheKey($uploadId), [
                        'status' => 'queued',
                    ], now()->addMinutes(30));

                    UploadProductImageToLiara::dispatch($uploadId, $tempPath, $destinationPath);

                    return ['id' => $uploadId, 'status' => 'queued'];
                })
                ->all(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function imageUploadStatus(string $uploadId): array
    {
        Gate::authorize('create', Product::class);

        abort_unless(Str::isUuid($uploadId), 404);

        $status = Cache::get($this->uploadCacheKey($uploadId));

        abort_unless(is_array($status), 404);

        return $status;
    }

    /**
     * @return array{queued: bool}
     */
    public function deleteImage(Request $request): array
    {
        Gate::authorize('create', Product::class);

        $data = $request->validate([
            'path' => ['required', 'string', 'max:2048'],
        ]);

        abort_unless($this->isProductImagePath($data['path']), 422, 'Invalid product image path.');

        DeleteLiaraFile::dispatch($data['path']);

        return [
            'queued' => true,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?Product $product = null): array
    {
        $data = $request->validate([
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'title' => ['required', 'string', 'max:255'],
            'slug' => [
                'required',
                'string',
                'max:255',
                Rule::unique('products', 'slug')->ignore($product),
            ],
            'excerpt' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'is_active' => ['required', 'boolean'],
            'image_url' => ['nullable', 'string', 'max:2048'],
            'subproducts' => ['required', 'array', 'min:1'],
            'subproducts.*.id' => ['nullable', 'integer', 'exists:sub_products,id'],
            'subproducts.*.price' => ['required', 'integer', 'min:0', 'max:999999999999999'],
            'subproducts.*.stock' => ['required', 'integer', 'min:0'],
            'subproducts.*.size' => ['nullable', 'string', 'max:100'],
            'subproducts.*.color_name' => ['nullable', 'string', 'max:100'],
            'subproducts.*.color_hex' => ['nullable', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'subproducts.*.photo_urls' => ['nullable', 'array'],
            'subproducts.*.photo_urls.*' => ['string', 'max:2048'],
            'subproducts.*.discount_type' => ['nullable', Rule::in([DiscountType::Percent->value, DiscountType::Amount->value])],
            'subproducts.*.discount_value' => ['nullable', 'integer', 'min:1'],
            'subproducts.*.discount_starts_at' => ['nullable', 'date'],
            'subproducts.*.discount_ends_at' => ['nullable', 'date', 'after_or_equal:subproducts.*.discount_starts_at'],
            'subproducts.*.discount_usage_limit' => ['nullable', 'integer', 'min:1'],
        ]);

        $data['is_active'] = $request->boolean('is_active');
        $data['image_url'] = filled($data['image_url'] ?? null) ? $data['image_url'] : null;
        $data['subproducts'] = collect($data['subproducts'])
            ->map(function (array $subProduct): array {
                $subProduct['size'] = filled($subProduct['size'] ?? null) ? $subProduct['size'] : null;
                $subProduct['color_name'] = filled($subProduct['color_name'] ?? null) ? $subProduct['color_name'] : null;
                $subProduct['color_hex'] = filled($subProduct['color_hex'] ?? null) ? strtoupper($subProduct['color_hex']) : null;
                $subProduct['photo_urls'] = collect($subProduct['photo_urls'] ?? [])
                    ->filter(fn (string $path): bool => $this->isProductImagePath($path))
                    ->values()
                    ->all();

                $hasDiscount = filled($subProduct['discount_type'] ?? null) && filled($subProduct['discount_value'] ?? null);

                if ($hasDiscount) {
                    $discountValue = (int) $subProduct['discount_value'];

                    if ($subProduct['discount_type'] === DiscountType::Percent->value) {
                        $discountValue = min(100, $discountValue);
                    }

                    $subProduct['discount_value'] = $discountValue;
                    $subProduct['discount_starts_at'] = filled($subProduct['discount_starts_at'] ?? null) ? $subProduct['discount_starts_at'] : null;
                    $subProduct['discount_ends_at'] = filled($subProduct['discount_ends_at'] ?? null) ? $subProduct['discount_ends_at'] : null;
                    $subProduct['discount_usage_limit'] = filled($subProduct['discount_usage_limit'] ?? null) ? (int) $subProduct['discount_usage_limit'] : null;
                } else {
                    $subProduct['discount_type'] = null;
                    $subProduct['discount_value'] = null;
                    $subProduct['discount_starts_at'] = null;
                    $subProduct['discount_ends_at'] = null;
                    $subProduct['discount_usage_limit'] = null;
                }

                return $subProduct;
            })
            ->values()
            ->all();

        return $data;
    }

    /**
     * @param array<int, array<string, mixed>> $subProducts
     */
    private function syncSubProducts(Product $product, array $subProducts): void
    {
        $retainedIds = [];

        foreach ($subProducts as $index => $subProductData) {
            $id = $subProductData['id'] ?? null;
            unset($subProductData['id']);

            $subProductData['sort_order'] = $index;

            $subProduct = $id
                ? $product->subProducts()->whereKey($id)->first()
                : null;

            if ($subProduct) {
                $subProduct->update($subProductData);
            } else {
                $subProduct = $product->subProducts()->create($subProductData);
            }

            $retainedIds[] = $subProduct->id;
        }

        $product->subProducts()
            ->when($retainedIds !== [], fn (Builder $query): Builder => $query->whereNotIn('id', $retainedIds))
            ->delete();
    }

    /**
     * @return array<int, array{id: int, name: string}>
     */
    private function categoryOptions(): array
    {
        return Category::query()
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (Category $category): array => [
                'id' => $category->id,
                'name' => $category->name,
            ])
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(Product $product): array
    {
        $product->loadMissing('subProducts');
        $firstSubProduct = $product->subProducts->first();

        return [
            'id' => $product->id,
            'category_id' => $product->category_id,
            'category_name' => $product->category?->name,
            'title' => $product->title,
            'slug' => $product->slug,
            'excerpt' => $product->excerpt,
            'description' => $product->description,
            'price' => $firstSubProduct ? (float) $firstSubProduct->price : 0,
            'stock' => $firstSubProduct?->stock ?? 0,
            'size' => $firstSubProduct?->size,
            'color_name' => $firstSubProduct?->color_name,
            'color_hex' => $firstSubProduct?->color_hex,
            'image_url' => $product->image_url,
            'image_preview_url' => LiaraUrl::fromPath($product->image_url),
            'subproducts' => $product->subProducts->map(fn (SubProduct $subProduct): array => [
                'id' => $subProduct->id,
                'price' => (float) $subProduct->price,
                'stock' => $subProduct->stock,
                'size' => $subProduct->size,
                'color_name' => $subProduct->color_name,
                'color_hex' => $subProduct->color_hex,
                'discount_type' => $subProduct->discount_type?->value,
                'discount_value' => $subProduct->discount_value !== null ? (int) $subProduct->discount_value : null,
                'discount_starts_at' => $subProduct->discount_starts_at?->toISOString(),
                'discount_ends_at' => $subProduct->discount_ends_at?->toISOString(),
                'discount_usage_limit' => $subProduct->discount_usage_limit,
                'discount_used_count' => $subProduct->discount_used_count,
                'photo_urls' => $subProduct->photo_urls ?? [],
                'photo_preview_urls' => collect($subProduct->photo_urls ?? [])->map(fn (?string $path): ?string => LiaraUrl::fromPath($path))->all(),
            ])->values()->all(),
            'is_active' => $product->is_active,
            'created_at' => $product->created_at?->toISOString(),
        ];
    }

    private function isProductImagePath(string $path): bool
    {
        return str_starts_with($path, 'products/') && ! str_contains($path, '..');
    }

    private function uploadCacheKey(string $uploadId): string
    {
        return "admin-product-image-upload:{$uploadId}";
    }
}
