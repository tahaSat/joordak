<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table): void {
            $table->decimal('subtotal', 18, 0)->default(0)->after('total');
            $table->foreignId('discount_code_id')->nullable()->after('subtotal')->constrained('discount_codes')->nullOnDelete();
            $table->string('discount_code')->nullable()->after('discount_code_id');
            $table->decimal('invoice_discount_amount', 18, 0)->default(0)->after('discount_code');
        });

        Schema::table('invoice_items', function (Blueprint $table): void {
            $table->decimal('original_unit_price', 15, 0)->default(0)->after('unit_price');
            $table->decimal('product_discount_amount', 18, 0)->default(0)->after('original_unit_price');
        });
    }

    public function down(): void
    {
        Schema::table('invoice_items', function (Blueprint $table): void {
            $table->dropColumn(['original_unit_price', 'product_discount_amount']);
        });

        Schema::table('invoices', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('discount_code_id');
            $table->dropColumn(['subtotal', 'discount_code', 'invoice_discount_amount']);
        });
    }
};
