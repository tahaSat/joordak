<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Support\LiaraUrl;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;

class HomeBannerController extends Controller
{
    public function upload(Request $request)
    {
        $request->validate([
            'banner' => ['required', 'image', 'max:5120'],
        ]);

        $file = $request->file('banner');
        $path = $file->store('banners', 'liara');

        Setting::setValue('home_banner_path', $path);

        return back()->with('status', 'Banner uploaded successfully.');
    }

    public function temporaryUrl(): ?string
    {
        $path = Setting::getValue('home_banner_path');
        if (! $path) {
            return null;
        }

        return $this->publicUrl($path);
    }
    public function image()
    {
        $path = Setting::getValue('home_banner_path');
        if (! $path) {
            abort(404);
        }

        try {
            return Storage::disk('liara')->response($path);
        } catch (\Throwable $e) {
            return response('Banner not found', Response::HTTP_NOT_FOUND);
        }
    }

    public function publicUrl(?string $path): ?string
    {
        $url = LiaraUrl::fromPath($path);
        if (! $url) {
            return route('home-banner.image');
        }

        return $url;
     }
}
