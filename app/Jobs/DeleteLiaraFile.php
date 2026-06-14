<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Storage;
use Throwable;

class DeleteLiaraFile implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 35;

    public bool $failOnTimeout = true;

    public function __construct(public string $path)
    {
        $this->onQueue('media');
    }

    public function handle(): void
    {
        try {
            Storage::disk('liara')->delete($this->path);
        } catch (Throwable $exception) {
            report($exception);
            $this->release(now()->addMinutes(5));
        }
    }
}
