<?php

namespace App\Support;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;

class RedirectAfterAuth
{
    public const SESSION_KEY = 'url.intended';

    /**
     * @return array<int, string>
     */
    public static function blockedPaths(): array
    {
        return [
            '/login',
            '/register',
            '/logout',
            '/otp/send',
            '/otp/cancel',
        ];
    }

    public static function rememberFromQuery(Request $request): void
    {
        if ($request->session()->has(self::SESSION_KEY)) {
            return;
        }

        $redirect = $request->query('redirect');

        if (! is_string($redirect) || $redirect === '') {
            return;
        }

        $normalized = self::normalize($redirect);

        if ($normalized === null) {
            return;
        }

        $request->session()->put(self::SESSION_KEY, $normalized);
    }

    public static function normalize(?string $url): ?string
    {
        if ($url === null || $url === '') {
            return null;
        }

        if (str_starts_with($url, '/')) {
            return self::isAllowedPath($url) ? $url : null;
        }

        if (! URL::isValidUrl($url)) {
            return null;
        }

        $appHost = parse_url(config('app.url'), PHP_URL_HOST);
        $targetHost = parse_url($url, PHP_URL_HOST);

        if (! is_string($appHost) || ! is_string($targetHost) || strcasecmp($appHost, $targetHost) !== 0) {
            return null;
        }

        $path = parse_url($url, PHP_URL_PATH) ?? '/';
        $query = parse_url($url, PHP_URL_QUERY);
        $normalized = $path.($query ? '?'.$query : '');

        return self::isAllowedPath($normalized) ? $normalized : null;
    }

    public static function isAllowedPath(string $path): bool
    {
        $pathOnly = strtok($path, '?') ?: $path;

        foreach (self::blockedPaths() as $blockedPath) {
            if ($pathOnly === $blockedPath || str_starts_with($pathOnly, $blockedPath.'/')) {
                return false;
            }
        }

        return true;
    }
}
