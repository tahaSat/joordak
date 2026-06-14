<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\DeleteLiaraFile;
use App\Jobs\UploadProductImageToLiara;
use App\Models\Setting;
use App\Support\LiaraUrl;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    public function edit(): Response
    {
        Gate::authorize('viewAny', Setting::class);

        $path = Setting::getValue('home_banner_path');

        return Inertia::render('Admin/Settings/Edit', [
            'banner' => [
                'path' => $path,
                'preview_url' => LiaraUrl::fromPath($path) ?? ($path ? route('home-banner.image') : null),
            ],
            'settings' => [
                'post_cost_tehran' => Setting::getValue('post_cost_tehran', '0'),
                'post_cost_others' => Setting::getValue('post_cost_others', '0'),
                'hero_title' => Setting::getValue('hero_title', 'به جردک خوش آمدید'),
                'hero_subtitle' => Setting::getValue('hero_subtitle', 'فروشگاه آنلاین مد و پوشاک'),
            ],
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        Gate::authorize('update', Setting::class);

        $data = $request->validate([
            'path' => ['nullable', 'string', 'max:2048'],
            'post_cost_tehran' => ['required', 'integer', 'min:0'],
            'post_cost_others' => ['required', 'integer', 'min:0'],
            'hero_title' => ['required', 'string', 'max:255'],
            'hero_subtitle' => ['nullable', 'string', 'max:255'],
        ]);

        if (filled($data['path'] ?? null)) {
            abort_unless($this->isBannerPath($data['path']), 422, 'Invalid banner path.');
        }

        Setting::setValue('home_banner_path', $data['path'] ?? null);
        Setting::setValue('post_cost_tehran', (string) $data['post_cost_tehran']);
        Setting::setValue('post_cost_others', (string) $data['post_cost_others']);
        Setting::setValue('hero_title', $data['hero_title']);
        Setting::setValue('hero_subtitle', $data['hero_subtitle'] ?? null);

        return back()->with('status', 'تنظیمات به‌روزرسانی شد.');
    }

    /**
     * @return array{upload: array{id: string, status: string}}
     */
    public function upload(Request $request): array
    {
        Gate::authorize('update', Setting::class);

        $data = $request->validate([
            'banner' => ['required', 'image', 'max:5120'],
        ]);

        $file = $data['banner'];
        $uploadId = (string) Str::uuid();
        $extension = $file->extension() ?: 'jpg';
        $tempPath = $file->storeAs('admin-home-banner-uploads', "{$uploadId}.{$extension}", 'local');
        $destinationPath = "banners/{$uploadId}.{$extension}";

        abort_if($tempPath === false, 500, 'Unable to queue banner upload.');

        Cache::put($this->uploadCacheKey($uploadId), [
            'status' => 'queued',
        ], now()->addMinutes(30));

        UploadProductImageToLiara::dispatch($uploadId, $tempPath, $destinationPath, 'admin-home-banner-upload');

        return [
            'upload' => ['id' => $uploadId, 'status' => 'queued'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function uploadStatus(string $uploadId): array
    {
        Gate::authorize('update', Setting::class);

        abort_unless(Str::isUuid($uploadId), 404);

        $status = Cache::get($this->uploadCacheKey($uploadId));

        abort_unless(is_array($status), 404);

        return $status;
    }

    /**
     * @return array{queued: bool}
     */
    public function delete(Request $request): array
    {
        Gate::authorize('update', Setting::class);

        $data = $request->validate([
            'path' => ['required', 'string', 'max:2048'],
        ]);

        abort_unless($this->isBannerPath($data['path']), 422, 'Invalid banner path.');

        if (Setting::getValue('home_banner_path') === $data['path']) {
            Setting::setValue('home_banner_path', null);
        }

        DeleteLiaraFile::dispatch($data['path']);

        return ['queued' => true];
    }

    private function isBannerPath(string $path): bool
    {
        return str_starts_with($path, 'banners/') && ! str_contains($path, '..');
    }

    private function uploadCacheKey(string $uploadId): string
    {
        return "admin-home-banner-upload:{$uploadId}";
    }
}
