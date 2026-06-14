<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cart_items', function (Blueprint $table): void {
            $table->decimal('unit_price', 15, 0)->change();
        });

        Schema::table('invoice_items', function (Blueprint $table): void {
            $table->decimal('unit_price', 15, 0)->change();
            $table->decimal('line_total', 18, 0)->change();
        });

        Schema::table('invoices', function (Blueprint $table): void {
            $table->decimal('total', 18, 0)->default(0)->change();
        });

        Schema::table('payments', function (Blueprint $table): void {
            $table->decimal('amount', 18, 0)->change();
        });
    }

    public function down(): void
    {
        Schema::table('cart_items', function (Blueprint $table): void {
            $table->decimal('unit_price', 10, 2)->change();
        });

        Schema::table('invoice_items', function (Blueprint $table): void {
            $table->decimal('unit_price', 10, 2)->change();
            $table->decimal('line_total', 12, 2)->change();
        });

        Schema::table('invoices', function (Blueprint $table): void {
            $table->decimal('total', 12, 2)->default(0)->change();
        });

        Schema::table('payments', function (Blueprint $table): void {
            $table->decimal('amount', 12, 2)->change();
        });
    }
};
