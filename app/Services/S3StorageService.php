<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class S3StorageService
{
    protected string $disk;

    public function __construct(string $disk = 'liara')
    {
        $this->disk = $disk;
    }

    public function uploadFromPath(string $pathOnDisk, string $localFilePath, string $visibility = 'private'): bool
    {
        $contents = file_get_contents($localFilePath);
        if ($contents === false) {
            return false;
        }

        return Storage::disk($this->disk)->put($pathOnDisk, $contents, $visibility);
    }

    public function uploadFromContents(string $pathOnDisk, string $contents, string $visibility = 'private'): bool
    {
        return Storage::disk($this->disk)->put($pathOnDisk, $contents, $visibility);
    }

    public function getPresignedUrl(string $pathOnDisk, int $minutes = 60): string
    {
        $expires = Carbon::now()->addMinutes($minutes);
        return Storage::disk($this->disk)->temporaryUrl($pathOnDisk, $expires);
    }

    public function listFilesWithPresignedUrls(string $directory = '', int $minutes = 60): array
    {
        $files = Storage::disk($this->disk)->allFiles($directory);
        $result = [];

        foreach ($files as $file) {
            $result[] = [
                'path' => $file,
                'url' => $this->getPresignedUrl($file, $minutes),
            ];
        }

        return $result;
    }
}
