<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sub_products', function (Blueprint $table): void {
            $table->string('discount_type', 10)->nullable()->after('price');
            $table->decimal('discount_value', 15, 0)->nullable()->after('discount_type');
            $table->timestamp('discount_starts_at')->nullable()->after('discount_value');
            $table->timestamp('discount_ends_at')->nullable()->after('discount_starts_at');
            $table->unsignedInteger('discount_usage_limit')->nullable()->after('discount_ends_at');
            $table->unsignedInteger('discount_used_count')->default(0)->after('discount_usage_limit');
        });
    }

    public function down(): void
    {
        Schema::table('sub_products', function (Blueprint $table): void {
            $table->dropColumn([
                'discount_type',
                'discount_value',
                'discount_starts_at',
                'discount_ends_at',
                'discount_usage_limit',
                'discount_used_count',
            ]);
        });
    }
};
