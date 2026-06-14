<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\SendOtpRequest;
use App\Services\OtpService;
use App\Services\SmsService;
use App\Support\PendingOtp;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

class OtpController extends Controller
{
    public function send(SendOtpRequest $request, OtpService $otpService, SmsService $smsService): RedirectResponse
    {
        $phone = $request->normalizedPhone();
        $purpose = (string) $request->input('purpose');
        $throttleKey = "otp-send:{$purpose}:{$phone}";

        if (RateLimiter::tooManyAttempts($throttleKey, 3)) {
            $seconds = RateLimiter::availableIn($throttleKey);

            throw ValidationException::withMessages([
                'phone' => "لطفاً {$seconds} ثانیه دیگر دوباره تلاش کنید.",
            ]);
        }

        RateLimiter::hit($throttleKey, PendingOtp::RESEND_COOLDOWN_SECONDS);

        $code = $otpService->generate($phone, $purpose);

        try {
            $smsService->sendOtp($phone, $code);
        } catch (\Throwable $exception) {
            report($exception);

            throw ValidationException::withMessages([
                'phone' => 'ارسال پیامک با خطا مواجه شد. لطفاً دوباره تلاش کنید.',
            ]);
        }

        PendingOtp::store(
            $request,
            $phone,
            $purpose,
            $purpose === 'register' ? (string) $request->input('name') : null,
        );

        return back();
    }

    public function cancel(Request $request): RedirectResponse
    {
        PendingOtp::forget($request);

        return back();
    }
}
