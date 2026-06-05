<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\S3StorageService;
use Illuminate\Support\Facades\Log;

class S3StorageController extends Controller
{
    protected S3StorageService $s3;

    public function __construct()
    {
        $this->s3 = new S3StorageService();
    }

    public function uploadExample(Request $request)
    {
        if (! $request->hasFile('file')) {
            return response()->json(['error' => 'file missing'], 422);
        }

        $file = $request->file('file');
        $path = 'uploads/' . uniqid('', true) . '_' . $file->getClientOriginalName();

        $ok = $this->s3->uploadFromPath($path, $file->getRealPath());

        if (! $ok) {
            return response()->json(['error' => 'upload failed'], 500);
        }

        $url = $this->s3->getPresignedUrl($path, 60);

        return response()->json(['path' => $path, 'url' => $url]);
    }

    public function listPresigned(Request $request)
    {
        $minutes = (int) $request->input('minutes', 60);
        $directory = $request->input('dir', '');

        $list = $this->s3->listFilesWithPresignedUrls($directory, $minutes);

        return response()->json($list);
    }
}
