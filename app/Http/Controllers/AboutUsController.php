<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Support\AboutUsSeo;
use App\Support\LiaraUrl;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class AboutUsController extends Controller
{
    private const PAGE_TITLE = 'درباره ی ما';

    private const FALLBACK_DESCRIPTION = 'فروشگاه آنلاین جردک — استایل خود را از بالا تا پایین بسازید.';

    public function show(): InertiaResponse
    {
        $coverPath = AboutUsSeo::coverPath();
        $coverUrl = LiaraUrl::fromPath($coverPath) ?? ($coverPath ? route('about-us-cover.image') : null);
        $description = AboutUsSeo::description();

        return Inertia::render('About/Show', [
            'cover' => [
                'path' => $coverPath,
                'preview_url' => $coverUrl,
            ],
            'description' => $description,
            'metaDescription' => AboutUsSeo::metaDescription(self::FALLBACK_DESCRIPTION),
            'structuredData' => AboutUsSeo::pageStructuredData(
                self::PAGE_TITLE,
                'جردک',
                $coverUrl,
                self::FALLBACK_DESCRIPTION,
            ),
        ]);
    }

    public function coverImage()
    {
        $path = Setting::getValue('about_us_cover_path');
        if (! $path) {
            abort(404);
        }

        try {
            return Storage::disk('liara')->response($path);
        } catch (\Throwable $e) {
            return response('Cover not found', Response::HTTP_NOT_FOUND);
        }
    }
}
