<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\SubProduct;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminProductImagePersistenceTest extends TestCase
{
    use RefreshDatabase;

    public function test_store_persists_cover_and_gallery_image_paths(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->post(route('admin.products.store'), [
            'title' => 'Test Product',
            'slug' => 'test-product',
            'excerpt' => null,
            'description' => null,
            'is_active' => true,
            'image_url' => 'products/cover-uuid.jpg',
            'subproducts' => [
                [
                    'price' => 100000,
                    'stock' => 5,
                    'size' => null,
                    'color_name' => null,
                    'color_hex' => null,
                    'photo_urls' => [
                        'products/gallery/gallery-uuid.jpg',
                    ],
                ],
            ],
        ]);

        $response->assertRedirect(route('admin.products.index'));

        $product = Product::query()->where('slug', 'test-product')->first();
        $this->assertNotNull($product);
        $this->assertSame('products/cover-uuid.jpg', $product->image_url);

        $subProduct = SubProduct::query()->where('product_id', $product->id)->first();
        $this->assertNotNull($subProduct);
        $this->assertSame(['products/gallery/gallery-uuid.jpg'], $subProduct->photo_urls);
    }

    public function test_update_persists_uploaded_image_paths(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $product = Product::query()->create([
            'title' => 'Existing Product',
            'slug' => 'existing-product',
            'is_active' => true,
        ]);

        $subProduct = SubProduct::query()->create([
            'product_id' => $product->id,
            'price' => 50000,
            'stock' => 1,
            'sort_order' => 0,
        ]);

        $response = $this->actingAs($admin)->put(route('admin.products.update', $product), [
            'title' => 'Existing Product',
            'slug' => 'existing-product',
            'excerpt' => null,
            'description' => null,
            'is_active' => true,
            'image_url' => 'products/new-cover.jpg',
            'subproducts' => [
                [
                    'id' => $subProduct->id,
                    'price' => 50000,
                    'stock' => 1,
                    'size' => null,
                    'color_name' => null,
                    'color_hex' => null,
                    'photo_urls' => [
                        'products/gallery/new-gallery.jpg',
                    ],
                ],
            ],
        ]);

        $response->assertRedirect(route('admin.products.index'));

        $product->refresh();
        $subProduct->refresh();

        $this->assertSame('products/new-cover.jpg', $product->image_url);
        $this->assertSame(['products/gallery/new-gallery.jpg'], $subProduct->photo_urls);
    }
}
