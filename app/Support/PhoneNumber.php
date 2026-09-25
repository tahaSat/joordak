<?php

namespace App\Support;

class PhoneNumber
{
    public static function normalize(string $phone): string
    {
        $phone = self::toAsciiDigits($phone);
        $digits = preg_replace('/\D/', '', $phone) ?? '';

        if (str_starts_with($digits, '98') && strlen($digits) === 12) {
            return '0'.substr($digits, 2);
        }

        if (str_starts_with($digits, '9') && strlen($digits) === 10) {
            return '0'.$digits;
        }

        return $digits;
    }

    public static function isValid(string $phone): bool
    {
        return (bool) preg_match('/^09\d{9}$/', self::normalize($phone));
    }

    private static function toAsciiDigits(string $value): string
    {
        $persian = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
        $arabic = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
        $ascii = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

        return str_replace([...$persian, ...$arabic], [...$ascii, ...$ascii], $value);
    }
}
