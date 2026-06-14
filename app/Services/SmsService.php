<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class SmsService
{
    public function sendOtp(string $phone, string $code): void
    {
        $templateId = config('services.sms.template_id');

        if (blank($templateId)) {
            throw new RuntimeException('SMS template ID is not configured.');
        }

        $this->sendTemplate($phone, (int) $templateId, [
            config('services.sms.otp_parameter_name', 'Code') => $code,
        ], 'Failed to send verification SMS.');
    }

    public function sendDeliveredToPostNotification(string $phone, string $postalCode, string $invoiceLink): void
    {
        $templateId = config('services.sms.delivered_to_post_template_id', 982417);

        $this->sendTemplate($phone, (int) $templateId, [
            'CODE' => $postalCode,
            'LINK' => $invoiceLink,
        ], 'Failed to send delivered-to-post SMS.');
    }

    /**
     * @param  array<string, string>  $parameters
     */
    private function sendTemplate(string $phone, int $templateId, array $parameters, string $failureMessage): void
    {
        $apiKey = config('services.sms.api_key');

        if (blank($apiKey)) {
            throw new RuntimeException('SMS API key is not configured.');
        }

        if (app()->environment('local', 'testing')) {
            Log::info('SMS template', [
                'phone' => $phone,
                'template_id' => $templateId,
                'parameters' => $parameters,
            ]);

            return;
        }

        $response = Http::withHeaders([
            'X-API-KEY' => $apiKey,
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
        ])->post('https://api.sms.ir/v1/send/verify', [
            'mobile' => $phone,
            'TemplateId' => $templateId,
            'Parameters' => collect($parameters)
                ->map(fn (string $value, string $name): array => [
                    'Name' => $name,
                    'Value' => $value,
                ])
                ->values()
                ->all(),
        ]);

        if (! $response->successful()) {
            Log::error('SMS send failed', [
                'phone' => $phone,
                'template_id' => $templateId,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            throw new RuntimeException($failureMessage);
        }
    }
}
