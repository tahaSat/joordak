<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;

class OtpService
{
    public function generate(string $phone, string $purpose): string
    {
        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        Cache::put($this->cacheKey($phone, $purpose), $code, now()->addMinutes(5));

        return $code;
    }

    public function verify(string $phone, string $purpose, string $code): bool
    {
        $key = $this->cacheKey($phone, $purpose);
        $stored = Cache::get($key);

        if (! is_string($stored) || ! hash_equals($stored, $code)) {
            return false;
        }

        Cache::forget($key);

        return true;
    }

    private function cacheKey(string $phone, string $purpose): string
    {
        return "otp:{$purpose}:{$phone}";
    }
}
