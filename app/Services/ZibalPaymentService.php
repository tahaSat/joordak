<?php

namespace App\Services;

use App\Models\Payment;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class ZibalPaymentService
{
    public function requestLazy(Payment $payment): array
    {
        $payload = [
            'merchant' => $this->merchant(),
            'amount' => $this->amountInRials($payment),
            'callbackUrl' => $this->callbackUrl($payment),
            'description' => "Invoice #{$payment->invoice_id}",
            'orderId' => $payment->gateway_order_id,
        ];

        if ($payment->user?->phone) {
            $payload['mobile'] = $payment->user->phone;
        }

        return $this->post('/request/lazy', $payload);
    }

    public function verify(string $trackId): array
    {
        return $this->post('/verify', [
            'merchant' => $this->merchant(),
            'trackId' => $trackId,
        ]);
    }

    public function inquiry(string $trackId): array
    {
        return $this->post('/v1/inquiry', [
            'merchant' => $this->merchant(),
            'trackId' => $trackId,
        ]);
    }

    public function startUrl(string $trackId): string
    {
        return rtrim((string) config('services.zibal.start_url', 'https://gateway.zibal.ir/start'), '/').'/'.$trackId;
    }

    public function isSuccessfulRequest(array $response): bool
    {
        return (int) ($response['result'] ?? 0) === 100 && filled($response['trackId'] ?? null);
    }

    public function isSuccessfulVerification(array $response): bool
    {
        return in_array((int) ($response['result'] ?? 0), [100, 201], true);
    }

    public function isPaidInquiry(array $response): bool
    {
        return (int) ($response['result'] ?? 0) === 100 && (int) ($response['status'] ?? 0) === 2;
    }

    public function amountMatches(Payment $payment, array $response): bool
    {
        if (! array_key_exists('amount', $response)) {
            return true;
        }

        return (int) $response['amount'] === $this->amountInRials($payment);
    }

    public function amountInRials(Payment $payment): int
    {
        return (int) round((float) $payment->amount);
    }

    private function post(string $path, array $payload): array
    {
        $url = $this->url($path);

        Log::info('Zibal API request', [
            'path' => $path,
            'url' => $url,
            'payload' => $this->loggablePayload($payload),
        ]);

        $response = $this->http()->post($url, $payload);

        Log::info('Zibal API response', [
            'path' => $path,
            'url' => $url,
            'status' => $response->status(),
            'body' => $response->json() ?? $response->body(),
        ]);

        if ($response->failed()) {
            throw new RuntimeException('Zibal request failed with HTTP status '.$response->status());
        }

        return $response->json() ?? [];
    }

    private function http(): PendingRequest
    {
        return Http::asJson()
            ->acceptJson()
            ->timeout((int) config('services.zibal.timeout', 15));
    }

    private function url(string $path): string
    {
        return rtrim((string) config('services.zibal.base_url', 'https://gateway.zibal.ir'), '/').'/'.ltrim($path, '/');
    }

    private function callbackUrl(Payment $payment): string
    {
        return route('payments.zibal.success.callback', $payment->invoice_id);
    }

    private function merchant(): string
    {
        $merchant = config('services.zibal.merchant');

        if (blank($merchant)) {
            throw new RuntimeException('Zibal merchant code is not configured.');
        }

        return (string) $merchant;
    }

    private function loggablePayload(array $payload): array
    {
        if (array_key_exists('merchant', $payload)) {
            $payload['merchant'] = '[configured]';
        }

        return $payload;
    }
}
