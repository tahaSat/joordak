<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\OtpService;
use App\Support\PendingOtp;
use App\Support\PhoneNumber;
use App\Support\RedirectAfterAuth;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(Request $request): Response
    {
        RedirectAfterAuth::rememberFromQuery($request);

        return Inertia::render('Auth/Register', [
            'pendingOtp' => PendingOtp::forInertia($request, 'register'),
        ]);
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws ValidationException
     */
    public function store(Request $request, OtpService $otpService): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:20'],
            'otp' => ['required', 'string', 'digits:6'],
        ]);

        $phone = PhoneNumber::normalize($validated['phone']);

        if (! PhoneNumber::isValid($phone)) {
            throw ValidationException::withMessages([
                'phone' => 'شماره موبایل معتبر نیست.',
            ]);
        }

        if (User::query()->where('phone', $phone)->exists()) {
            throw ValidationException::withMessages([
                'phone' => 'این شماره موبایل قبلاً ثبت شده است.',
            ]);
        }

        if (! $otpService->verify($phone, 'register', $validated['otp'])) {
            throw ValidationException::withMessages([
                'otp' => 'کد تأیید نامعتبر یا منقضی شده است.',
            ]);
        }

        $user = User::create([
            'name' => $validated['name'],
            'phone' => $phone,
            'role' => 'customer',
            'password' => Hash::make(Str::random(32)),
        ]);

        event(new Registered($user));

        Auth::login($user);

        PendingOtp::forget($request);

        return redirect()->intended(route('dashboard', absolute: false));
    }
}
