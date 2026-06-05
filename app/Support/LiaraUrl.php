<?php

namespace App\Support;

class LiaraUrl
{
    public static function fromPath(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        if (preg_match('/^https?:\/\//i', $path)) {
            return $path;
        }

        $domain = trim((string) env('LIARA_DOMAIN', ''));
        if ($domain === '') {
            return null;
        }

        if (! preg_match('/^https?:\/\//i', $domain)) {
            $domain = 'https://' . $domain;
        }

        return rtrim($domain, '/') . '/' . ltrim($path, '/');
    }
}
