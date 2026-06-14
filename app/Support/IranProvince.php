<?php

namespace App\Support;

class IranProvince
{
    public const TEHRAN = 'تهران';

    /**
     * @return array<int, string>
     */
    public static function all(): array
    {
        return [
            'آذربایجان شرقی',
            'آذربایجان غربی',
            'اردبیل',
            'اصفهان',
            'البرز',
            'ایلام',
            'بوشهر',
            self::TEHRAN,
            'چهارمحال و بختیاری',
            'خراسان جنوبی',
            'خراسان رضوی',
            'خراسان شمالی',
            'خوزستان',
            'زنجان',
            'سمنان',
            'سیستان و بلوچستان',
            'فارس',
            'قزوین',
            'قم',
            'کردستان',
            'کرمان',
            'کرمانشاه',
            'کهگیلویه و بویراحمد',
            'گلستان',
            'گیلان',
            'لرستان',
            'مازندران',
            'مرکزی',
            'هرمزگان',
            'همدان',
            'یزد',
        ];
    }

    public static function isTehran(?string $province): bool
    {
        return trim((string) $province) === self::TEHRAN;
    }
}
