<?php

namespace App\Http\Requests\Auth;

use App\Models\User;
use App\Services\OtpService;
use App\Support\PhoneNumber;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'phone' => ['required', 'string', 'max:20'],
            'otp' => ['required', 'string', 'digits:6'],
        ];
    }

    /**
     * Attempt to authenticate the request's credentials.
     *
     * @throws ValidationException
     */
    public function authenticate(OtpService $otpService): void
    {
        $this->ensureIsNotRateLimited();

        $phone = PhoneNumber::normalize((string) $this->input('phone'));

        if (! PhoneNumber::isValid($phone)) {
            throw ValidationException::withMessages([
                'phone' => 'شماره موبایل معتبر نیست.',
            ]);
        }

        if (! $otpService->verify($phone, 'login', (string) $this->input('otp'))) {
            RateLimiter::hit($this->throttleKey());

            throw ValidationException::withMessages([
                'otp' => 'کد تأیید نامعتبر یا منقضی شده است.',
            ]);
        }

        $user = User::query()->where('phone', $phone)->first();

        if (! $user) {
            RateLimiter::hit($this->throttleKey());

            throw ValidationException::withMessages([
                'phone' => 'کاربری با این شماره موبایل یافت نشد.',
            ]);
        }

        Auth::login($user, $this->boolean('remember'));

        RateLimiter::clear($this->throttleKey());
    }

    /**
     * Ensure the login request is not rate limited.
     *
     * @throws ValidationException
     */
    public function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'otp' => trans('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    /**
     * Get the rate limiting throttle key for the request.
     */
    public function throttleKey(): string
    {
        $phone = PhoneNumber::normalize((string) $this->input('phone'));

        return Str::transliterate($phone.'|'.$this->ip());
    }
}
