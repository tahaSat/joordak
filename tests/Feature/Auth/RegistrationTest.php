<?php

namespace Tests\Feature\Auth;

use App\Services\OtpService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_screen_can_be_rendered(): void
    {
        $response = $this->get('/register');

        $response->assertStatus(200);
    }

    public function test_new_users_can_register(): void
    {
        $phone = '09123456789';

        $otp = app(OtpService::class)->generate($phone, 'register');

        $response = $this->post('/register', [
            'name' => 'Test User',
            'phone' => $phone,
            'otp' => $otp,
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));
    }
}
