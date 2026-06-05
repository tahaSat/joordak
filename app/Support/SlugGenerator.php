<?php

namespace App\Support;

class SlugGenerator
{
    public static function fromTitle(string $title): string
    {
        $title = trim($title);

        if ($title === '') {
            return '';
        }

        $title = self::normalizeLetters($title);
        $title = self::normalizeDigits($title);
        $title = str_replace("\u{200C}", '-', $title);
        $title = preg_replace('/[\s_]+/u', '-', $title) ?? '';
        $title = preg_replace('/[^\p{Arabic}\p{N}\-]+/u', '', $title) ?? '';
        $title = preg_replace('/-+/', '-', $title) ?? '';

        return trim($title, '-');
    }

    private static function normalizeLetters(string $value): string
    {
        return strtr($value, [
            'ي' => 'ی',
            'ك' => 'ک',
            'ة' => 'ه',
        ]);
    }

    private static function normalizeDigits(string $value): string
    {
        return strtr($value, [
            '0' => '۰', '1' => '۱', '2' => '۲', '3' => '۳', '4' => '۴',
            '5' => '۵', '6' => '۶', '7' => '۷', '8' => '۸', '9' => '۹',
            '٠' => '۰', '١' => '۱', '٢' => '۲', '٣' => '۳', '٤' => '۴',
            '٥' => '۵', '٦' => '۶', '٧' => '۷', '٨' => '۸', '٩' => '۹',
        ]);
    }
}
