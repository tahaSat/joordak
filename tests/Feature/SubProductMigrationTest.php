<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\SubProduct;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

class SubProductMigrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_verify_command_passes_when_products_have_default_sub_products(): void
    {
        $product = Product::query()->create([
            'title' => 'Test Product',
            'slug' => 'test-product',
            'description' => 'Test',
            'is_active' => true,
        ]);

        SubProduct::query()->create([
            'product_id' => $product->id,
            'price' => 100000,
            'stock' => 5,
            'sort_order' => 0,
        ]);

        $this->assertSame(0, Artisan::call('joordak:verify-sub-products'));
    }
}
