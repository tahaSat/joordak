<?php

namespace App\Support;

use App\Models\Setting;
use Carbon\Carbon;

class AboutUsSeo
{
    public static function description(): string
    {
        return trim((string) Setting::getValue('about_us_description', ''));
    }

    public static function coverPath(): ?string
    {
        return Setting::getValue('about_us_cover_path');
    }

    public static function hasContent(): bool
    {
        return self::description() !== '' || filled(self::coverPath());
    }

    public static function metaDescription(string $fallback): string
    {
        $description = self::description();

        if ($description === '') {
            return $fallback;
        }

        return self::truncate($description, 160);
    }

    public static function organizationDescription(string $fallback): string
    {
        $description = self::description();

        if ($description === '') {
            return $fallback;
        }

        return self::truncate($description, 500);
    }

    public static function contentLastModified(): Carbon
    {
        $timestamp = Setting::query()
            ->whereIn('key', ['about_us_description', 'about_us_cover_path'])
            ->max('updated_at');

        return $timestamp ? Carbon::parse($timestamp) : now();
    }

    /**
     * @return list<array<string, mixed>>
     */
    public static function pageStructuredData(string $pageTitle, string $brand, ?string $imageUrl, string $fallbackDescription): array
    {
        if (! self::hasContent()) {
            return [];
        }

        $baseUrl = rtrim((string) config('app.url'), '/');
        $pageUrl = route('about-us', absolute: true);
        $metaDescription = self::metaDescription($fallbackDescription);

        $aboutPage = [
            '@type' => 'AboutPage',
            '@id' => "{$pageUrl}#about",
            'url' => $pageUrl,
            'name' => $pageTitle,
            'description' => $metaDescription,
            'inLanguage' => 'fa-IR',
            'about' => [
                '@type' => 'Organization',
                '@id' => "{$baseUrl}/#organization",
                'name' => $brand,
                'description' => self::organizationDescription($fallbackDescription),
            ],
        ];

        if ($imageUrl) {
            $aboutPage['primaryImageOfPage'] = $imageUrl;
            $aboutPage['image'] = $imageUrl;
        }

        if (self::description() !== '') {
            $aboutPage['text'] = self::description();
        }

        return [
            [
                '@type' => 'BreadcrumbList',
                '@id' => "{$pageUrl}#breadcrumb",
                'itemListElement' => [
                    [
                        '@type' => 'ListItem',
                        'position' => 1,
                        'name' => 'خانه',
                        'item' => $baseUrl.'/',
                    ],
                    [
                        '@type' => 'ListItem',
                        'position' => 2,
                        'name' => $pageTitle,
                        'item' => $pageUrl,
                    ],
                ],
            ],
            $aboutPage,
        ];
    }

    private static function truncate(string $text, int $limit): string
    {
        $normalized = preg_replace('/\s+/u', ' ', trim($text)) ?? trim($text);

        if (mb_strlen($normalized) <= $limit) {
            return $normalized;
        }

        return rtrim(mb_substr($normalized, 0, $limit - 1)).'…';
    }
}
