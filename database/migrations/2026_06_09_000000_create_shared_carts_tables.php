<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shared_carts', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('token', 80)->unique();
            $table->unsignedInteger('claimed_count')->default(0);
            $table->timestamps();
        });

        Schema::create('shared_cart_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('shared_cart_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('sub_product_id')->constrained('sub_products')->cascadeOnDelete();
            $table->unsignedInteger('quantity')->default(1);
            $table->decimal('unit_price', 15, 0);
            $table->timestamps();

            $table->unique(['shared_cart_id', 'sub_product_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shared_cart_items');
        Schema::dropIfExists('shared_carts');
    }
};
