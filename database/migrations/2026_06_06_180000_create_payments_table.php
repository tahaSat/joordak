<?php

use App\Enums\PaymentStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('gateway')->default('zibal');
            $table->decimal('amount', 12, 2);
            $table->string('currency', 8)->default('IRR');
            $table->string('status')->default(PaymentStatus::Pending->value);
            $table->string('gateway_track_id')->nullable()->index();
            $table->string('gateway_order_id')->nullable()->index();
            $table->string('gateway_ref_number')->nullable();
            $table->string('card_number')->nullable();
            $table->string('hashed_card_number')->nullable();
            $table->timestamp('requested_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->timestamp('failed_at')->nullable();
            $table->timestamp('last_checked_at')->nullable();
            $table->unsignedInteger('attempt_count')->default(0);
            $table->json('request_payload')->nullable();
            $table->json('callback_payload')->nullable();
            $table->json('verify_payload')->nullable();
            $table->json('inquiry_payload')->nullable();
            $table->text('failure_message')->nullable();
            $table->timestamps();

            $table->index(['invoice_id', 'status']);
            $table->index(['gateway', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
