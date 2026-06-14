<?php

use App\Enums\PaymentStatus;
use App\Jobs\ReconcileZibalPayment;
use App\Models\Payment;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::call(function (): void {
    Payment::query()
        ->where('gateway', 'zibal')
        ->where('status', PaymentStatus::Processing->value)
        ->whereNotNull('gateway_track_id')
        ->where(function ($query): void {
            $query->whereNull('last_checked_at')
                ->orWhere('last_checked_at', '<=', now()->subMinutes(10));
        })
        ->where('requested_at', '<=', now()->subMinutes(5))
        ->limit(50)
        ->get()
        ->each(fn (Payment $payment) => ReconcileZibalPayment::dispatch($payment));
})->everyFiveMinutes();
