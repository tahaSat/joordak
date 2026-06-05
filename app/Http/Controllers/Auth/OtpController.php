<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\SendOtpRequest;
use App\Services\OtpService;
use App\Services\SmsService;
use Illuminate\Http\RedirectResponse;
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

        RateLimiter::hit($throttleKey, 60);

        $code = $otpService->generate($phone, $purpose);

        try {
            $smsService->sendOtp($phone, $code);
        } catch (\Throwable $exception) {
            report($exception);

            throw ValidationException::withMessages([
                'phone' => 'ارسال پیامک با خطا مواجه شد. لطفاً دوباره تلاش کنید.',
            ]);
        }

        return back()->with('otp_sent', true);
    }
}
