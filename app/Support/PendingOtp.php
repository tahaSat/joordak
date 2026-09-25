<?php

namespace App\Support;

use Illuminate\Http\Request;

class PendingOtp
{
    public const SESSION_KEY = 'pending_otp';

    public const TTL_MINUTES = 5;

    public const RESEND_COOLDOWN_SECONDS = 120;

    public static function store(Request $request, string $phone, string $purpose): void
    {
        $request->session()->put(self::SESSION_KEY, [
            'phone' => $phone,
            'purpose' => $purpose,
            'sent_at' => now()->timestamp,
        ]);
    }

    public static function get(Request $request): ?array
    {
        $data = $request->session()->get(self::SESSION_KEY);

        if (! is_array($data)) {
            return null;
        }

        $sentAt = (int) ($data['sent_at'] ?? 0);

        if ($sentAt <= 0 || now()->timestamp - $sentAt > self::TTL_MINUTES * 60) {
            self::forget($request);

            return null;
        }

        return $data;
    }

    public static function forget(Request $request): void
    {
        $request->session()->forget(self::SESSION_KEY);
    }

    public static function resendSecondsRemaining(?array $pending): int
    {
        if (! $pending) {
            return 0;
        }

        $elapsed = now()->timestamp - (int) ($pending['sent_at'] ?? 0);

        return max(0, self::RESEND_COOLDOWN_SECONDS - $elapsed);
    }

    /**
     * @return array{phone: string, purpose: string, sentAt: int, resendSecondsRemaining: int}|null
     */
    public static function forInertia(Request $request): ?array
    {
        $pending = self::get($request);

        if (! $pending) {
            return null;
        }

        $purpose = (string) ($pending['purpose'] ?? '');

        if (! in_array($purpose, ['login', 'register'], true)) {
            return null;
        }

        return [
            'phone' => (string) $pending['phone'],
            'purpose' => $purpose,
            'sentAt' => (int) $pending['sent_at'],
            'resendSecondsRemaining' => self::resendSecondsRemaining($pending),
        ];
    }
}
