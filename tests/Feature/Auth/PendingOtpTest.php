<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Support\PendingOtp;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PendingOtpTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_page_restores_pending_otp_after_refresh(): void
    {
        $user = User::factory()->create();

        $this->post('/otp/send', [
            'phone' => $user->phone,
            'purpose' => 'login',
        ])->assertRedirect();

        $this->get('/login')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Auth/Login')
                ->where('pendingOtp.phone', $user->phone)
                ->where('pendingOtp.resendSecondsRemaining', fn ($value) => $value > 0 && $value <= PendingOtp::RESEND_COOLDOWN_SECONDS)
            );

        $this->get('/login')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Auth/Login')
                ->where('pendingOtp.phone', $user->phone)
            );
    }

    public function test_cancel_clears_pending_otp(): void
    {
        $user = User::factory()->create();

        $this->post('/otp/send', [
            'phone' => $user->phone,
            'purpose' => 'login',
        ]);

        $this->post('/otp/cancel')->assertRedirect();

        $this->get('/login')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Auth/Login')
                ->where('pendingOtp', null)
            );
    }

    public function test_register_pending_otp_includes_name(): void
    {
        $this->post('/otp/send', [
            'name' => 'Test User',
            'phone' => '09123456789',
            'purpose' => 'register',
        ])->assertRedirect();

        $this->get('/register')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Auth/Register')
                ->where('pendingOtp.phone', '09123456789')
                ->where('pendingOtp.name', 'Test User')
            );
    }
}
