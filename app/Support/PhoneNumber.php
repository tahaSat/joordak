<?php

namespace App\Support;

class PhoneNumber
{
    public static function normalize(string $phone): string
    {
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
}
