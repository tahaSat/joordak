<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class SmsService
{
    public function sendOtp(string $phone, string $code): void
    {
        $apiKey = config('services.sms.api_key');
        $templateId = config('services.sms.template_id');

        if (blank($apiKey)) {
            throw new RuntimeException('SMS API key is not configured.');
        }

        if (app()->environment('local', 'testing')) {
            Log::info('OTP SMS', ['phone' => $phone, 'code' => $code]);

            return;
        }

        if (blank($templateId)) {
            throw new RuntimeException('SMS template ID is not configured.');
        }

        $response = Http::withHeaders([
            'X-API-KEY' => $apiKey,
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
        ])->post('https://api.sms.ir/v1/send/verify', [
            'mobile' => $phone,
            'TemplateId' => (int) $templateId,
            'Parameters' => [
                [
                    'Name' => config('services.sms.otp_parameter_name', 'Code'),
                    'Value' => $code,
                ],
            ],
        ]);

        if (! $response->successful()) {
            Log::error('SMS send failed', [
                'phone' => $phone,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            throw new RuntimeException('Failed to send verification SMS.');
        }
    }
}
