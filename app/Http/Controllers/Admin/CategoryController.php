<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\DeleteLiaraFile;
use App\Jobs\UploadProductImageToLiara;
use App\Models\Category;
use App\Support\LiaraUrl;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Category::class);

        $filters = $request->only(['search']);

        $categories = Category::query()
            ->withCount('products')
            ->when($filters['search'] ?? null, function (Builder $query, string $search): void {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%");
            })
            ->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Category $category): array => $this->serialize($category));

        return Inertia::render('Admin/Categories/Index', [
            'categories' => $categories,
            'filters' => $filters,
        ]);
    }

    public function create(): Response
    {
        Gate::authorize('create', Category::class);

        return Inertia::render('Admin/Categories/Form', [
            'category' => null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('create', Category::class);

        Category::query()->create($this->validated($request));

        return redirect()->route('admin.categories.index')->with('status', 'دسته‌بندی ساخته شد.');
    }

    public function edit(Category $category): Response
    {
        Gate::authorize('update', $category);

        return Inertia::render('Admin/Categories/Form', [
            'category' => $this->serialize($category),
        ]);
    }

    public function update(Request $request, Category $category): RedirectResponse
    {
        Gate::authorize('update', $category);

        $category->update($this->validated($request, $category));

        return redirect()->route('admin.categories.edit', $category)->with('status', 'دسته‌بندی به‌روزرسانی شد.');
    }

    public function destroy(Category $category): RedirectResponse
    {
        Gate::authorize('delete', $category);

        $category->delete();

        return redirect()->route('admin.categories.index')->with('status', 'دسته‌بندی حذف شد.');
    }

    /**
     * @return array{upload: array{id: string, status: string}}
     */
    public function uploadImage(Request $request): array
    {
        Gate::authorize('create', Category::class);

        $data = $request->validate([
            'image' => ['required', 'image', 'max:5120'],
        ]);

        $file = $data['image'];
        $uploadId = (string) Str::uuid();
        $extension = $file->extension() ?: 'jpg';
        $tempPath = $file->storeAs('admin-category-image-uploads', "{$uploadId}.{$extension}", 'local');
        $destinationPath = "categories/{$uploadId}.{$extension}";

        abort_if($tempPath === false, 500, 'Unable to queue category image upload.');

        Cache::put($this->uploadCacheKey($uploadId), [
            'status' => 'queued',
        ], now()->addMinutes(30));

        UploadProductImageToLiara::dispatch($uploadId, $tempPath, $destinationPath, 'admin-category-image-upload');

        return [
            'upload' => ['id' => $uploadId, 'status' => 'queued'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function imageUploadStatus(string $uploadId): array
    {
        Gate::authorize('create', Category::class);

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
        Gate::authorize('create', Category::class);

        $data = $request->validate([
            'path' => ['required', 'string', 'max:2048'],
        ]);

        abort_unless($this->isCategoryImagePath($data['path']), 422, 'Invalid category image path.');

        DeleteLiaraFile::dispatch($data['path']);

        return ['queued' => true];
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?Category $category = null): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('categories', 'name')->ignore($category)],
            'slug' => ['required', 'string', 'max:255', Rule::unique('categories', 'slug')->ignore($category)],
            'description' => ['nullable', 'string'],
            'image_url' => ['nullable', 'string', 'max:2048'],
        ]);

        $data['image_url'] = filled($data['image_url'] ?? null) && $this->isCategoryImagePath($data['image_url'])
            ? $data['image_url']
            : null;

        return $data;
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(Category $category): array
    {
        return [
            'id' => $category->id,
            'name' => $category->name,
            'slug' => $category->slug,
            'description' => $category->description,
            'image_url' => $category->image_url,
            'image_preview_url' => LiaraUrl::fromPath($category->image_url),
            'products_count' => $category->products_count ?? null,
            'created_at' => $category->created_at?->toISOString(),
        ];
    }

    private function isCategoryImagePath(string $path): bool
    {
        return str_starts_with($path, 'categories/') && ! str_contains($path, '..');
    }

    private function uploadCacheKey(string $uploadId): string
    {
        return "admin-category-image-upload:{$uploadId}";
    }
}
