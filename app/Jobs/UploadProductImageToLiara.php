<?php

namespace App\Jobs;

use App\Support\LiaraUrl;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Throwable;

class UploadProductImageToLiara implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public int $timeout = 35;

    public bool $failOnTimeout = true;

    public function __construct(
        public string $uploadId,
        public string $tempPath,
        public string $destinationPath,
        public string $cacheKeyPrefix = 'admin-product-image-upload',
    ) {
        $this->onQueue('media');
    }

    public function handle(): void
    {
        Cache::put($this->cacheKey(), [
            'status' => 'processing',
        ], now()->addMinutes(30));

        $stream = Storage::disk('local')->readStream($this->tempPath);

        if ($stream === false) {
            throw new RuntimeException('Unable to read temporary product image.');
        }

        try {
            $stored = Storage::disk('liara')->put($this->destinationPath, $stream);

            if ($stored === false) {
                throw new RuntimeException('Unable to upload product image to Liara.');
            }
        } finally {
            if (is_resource($stream)) {
                fclose($stream);
            }
        }

        Storage::disk('local')->delete($this->tempPath);

        Cache::put($this->cacheKey(), [
            'status' => 'completed',
            'file' => [
                'path' => $this->destinationPath,
                'preview_url' => LiaraUrl::fromPath($this->destinationPath),
            ],
        ], now()->addMinutes(30));
    }

    public function failed(?Throwable $exception): void
    {
        Storage::disk('local')->delete($this->tempPath);

        Cache::put($this->cacheKey(), [
            'status' => 'failed',
            'message' => $exception?->getMessage() ?? 'Product image upload failed.',
        ], now()->addMinutes(30));
    }

    private function cacheKey(): string
    {
        return "{$this->cacheKeyPrefix}:{$this->uploadId}";
    }
}
