<?php

namespace Tests\Feature;

use App\Enums\InvoiceStatus;
use App\Enums\PaymentStatus;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

class CancelStalePendingInvoicesTest extends TestCase
{
    use RefreshDatabase;

    public function test_command_cancels_only_stale_pending_invoices(): void
    {
        $user = User::factory()->create();

        $staleInvoice = Invoice::query()->create([
            'user_id' => $user->id,
            'total' => 100000,
            'subtotal' => 100000,
            'shipping_cost' => 0,
            'status' => InvoiceStatus::PendingPayment,
        ]);
        $staleInvoice->forceFill([
            'created_at' => now()->subHours(25),
            'updated_at' => now()->subHours(25),
        ])->save();

        Payment::query()->create([
            'invoice_id' => $staleInvoice->id,
            'user_id' => $user->id,
            'gateway' => 'zibal',
            'amount' => 100000,
            'status' => PaymentStatus::Pending,
        ]);

        $recentInvoice = Invoice::query()->create([
            'user_id' => $user->id,
            'total' => 50000,
            'subtotal' => 50000,
            'shipping_cost' => 0,
            'status' => InvoiceStatus::PendingPayment,
        ]);

        $this->assertSame(0, Artisan::call('invoices:cancel-stale-pending'));

        $staleInvoice->refresh();
        $recentInvoice->refresh();

        $this->assertSame(InvoiceStatus::Cancelled, $staleInvoice->status);
        $this->assertSame(InvoiceStatus::PendingPayment, $recentInvoice->status);
        $this->assertSame(
            PaymentStatus::Cancelled,
            $staleInvoice->payments()->first()->fresh()->status,
        );
    }

    public function test_command_cancels_stale_processing_payment_invoices(): void
    {
        $user = User::factory()->create();

        $staleInvoice = Invoice::query()->create([
            'user_id' => $user->id,
            'total' => 100000,
            'subtotal' => 100000,
            'shipping_cost' => 0,
            'status' => InvoiceStatus::ProcessingPayment,
        ]);
        $staleInvoice->forceFill([
            'created_at' => now()->subHours(25),
            'updated_at' => now()->subHours(25),
        ])->save();

        Payment::query()->create([
            'invoice_id' => $staleInvoice->id,
            'user_id' => $user->id,
            'gateway' => 'zibal',
            'amount' => 100000,
            'status' => PaymentStatus::Processing,
            'gateway_track_id' => '12345',
        ]);

        $recentInvoice = Invoice::query()->create([
            'user_id' => $user->id,
            'total' => 50000,
            'subtotal' => 50000,
            'shipping_cost' => 0,
            'status' => InvoiceStatus::ProcessingPayment,
        ]);

        $this->assertSame(0, Artisan::call('invoices:cancel-stale-pending'));

        $staleInvoice->refresh();
        $recentInvoice->refresh();

        $this->assertSame(InvoiceStatus::Cancelled, $staleInvoice->status);
        $this->assertSame(InvoiceStatus::ProcessingPayment, $recentInvoice->status);
        $this->assertSame(
            PaymentStatus::Cancelled,
            $staleInvoice->payments()->first()->fresh()->status,
        );
    }
}
