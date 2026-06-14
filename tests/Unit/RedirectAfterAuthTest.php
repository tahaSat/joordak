<?php

namespace Tests\Unit;

use App\Support\RedirectAfterAuth;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class RedirectAfterAuthTest extends TestCase
{
    #[DataProvider('normalizeProvider')]
    public function test_normalize_accepts_safe_paths_and_rejects_auth_pages(?string $input, ?string $expected): void
    {
        $this->assertSame($expected, RedirectAfterAuth::normalize($input));
    }

    public static function normalizeProvider(): array
    {
        return [
            'product page' => ['/products/test-item', '/products/test-item'],
            'login page blocked' => ['/login', null],
            'register page blocked' => ['/register', null],
            'login with redirect query blocked' => ['/login?redirect=/cart', null],
            'empty path' => ['', null],
        ];
    }
}
