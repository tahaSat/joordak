<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table): void {
            $table->index('created_at', 'products_created_at_index');
            $table->index(['is_active', 'id'], 'products_is_active_id_index');
            $table->index(['is_active', 'category_id', 'id'], 'products_active_category_id_index');
        });

        Schema::table('categories', function (Blueprint $table): void {
            $table->index('created_at', 'categories_created_at_index');
        });

        Schema::table('sub_products', function (Blueprint $table): void {
            $table->index(['product_id', 'sort_order', 'id'], 'sub_products_product_sort_index');
            $table->index(['product_id', 'stock'], 'sub_products_product_stock_index');
        });

        Schema::table('invoices', function (Blueprint $table): void {
            $table->index(['created_at'], 'invoices_created_at_index');
            $table->index(['status', 'created_at'], 'invoices_status_created_at_index');
            $table->index(['user_id', 'created_at'], 'invoices_user_created_at_index');
            $table->index(['user_id', 'status', 'created_at'], 'invoices_user_status_created_at_index');
        });

        Schema::table('payments', function (Blueprint $table): void {
            $table->index(['invoice_id', 'status', 'created_at'], 'payments_invoice_status_created_at_index');
            $table->index(['gateway', 'status', 'requested_at'], 'payments_gateway_status_requested_at_index');
        });

        Schema::table('blog_posts', function (Blueprint $table): void {
            $table->index('created_at', 'blog_posts_created_at_index');
            $table->index(['is_published', 'published_at'], 'blog_posts_published_at_index');
        });

        Schema::table('discount_codes', function (Blueprint $table): void {
            $table->index('created_at', 'discount_codes_created_at_index');
        });

        Schema::table('cart_items', function (Blueprint $table): void {
            $table->index(['user_id', 'id'], 'cart_items_user_id_id_index');
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->index('created_at', 'users_created_at_index');
            $table->index(['role', 'created_at'], 'users_role_created_at_index');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropIndex('users_role_created_at_index');
            $table->dropIndex('users_created_at_index');
        });

        Schema::table('cart_items', function (Blueprint $table): void {
            $table->dropIndex('cart_items_user_id_id_index');
        });

        Schema::table('discount_codes', function (Blueprint $table): void {
            $table->dropIndex('discount_codes_created_at_index');
        });

        Schema::table('blog_posts', function (Blueprint $table): void {
            $table->dropIndex('blog_posts_published_at_index');
            $table->dropIndex('blog_posts_created_at_index');
        });

        Schema::table('payments', function (Blueprint $table): void {
            $table->dropIndex('payments_gateway_status_requested_at_index');
            $table->dropIndex('payments_invoice_status_created_at_index');
        });

        Schema::table('invoices', function (Blueprint $table): void {
            $table->dropIndex('invoices_user_status_created_at_index');
            $table->dropIndex('invoices_user_created_at_index');
            $table->dropIndex('invoices_status_created_at_index');
            $table->dropIndex('invoices_created_at_index');
        });

        Schema::table('sub_products', function (Blueprint $table): void {
            $table->dropIndex('sub_products_product_stock_index');
            $table->dropIndex('sub_products_product_sort_index');
        });

        Schema::table('categories', function (Blueprint $table): void {
            $table->dropIndex('categories_created_at_index');
        });

        Schema::table('products', function (Blueprint $table): void {
            $table->dropIndex('products_active_category_id_index');
            $table->dropIndex('products_is_active_id_index');
            $table->dropIndex('products_created_at_index');
        });
    }
};
