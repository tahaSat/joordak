<?php

namespace Tests\Feature;

use App\Jobs\UploadProductImageToLiara;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Bus;
use Tests\TestCase;

class ProductImageUploadTest extends TestCase
{
    use RefreshDatabase;

    public function test_gallery_upload_uses_products_gallery_destination(): void
    {
        Bus::fake();

        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->post(route('admin.products.images.store'), [
            'type' => 'gallery',
            'images' => [UploadedFile::fake()->image('gallery.jpg')],
        ]);

        $response->assertOk();

        Bus::assertDispatched(UploadProductImageToLiara::class, function (UploadProductImageToLiara $job): bool {
            return str_starts_with($job->destinationPath, 'products/gallery/');
        });
    }

    public function test_cover_upload_uses_products_destination(): void
    {
        Bus::fake();

        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->post(route('admin.products.images.store'), [
            'type' => 'cover',
            'images' => [UploadedFile::fake()->image('cover.jpg')],
        ]);

        $response->assertOk();

        Bus::assertDispatched(UploadProductImageToLiara::class, function (UploadProductImageToLiara $job): bool {
            return str_starts_with($job->destinationPath, 'products/')
                && ! str_starts_with($job->destinationPath, 'products/gallery/');
        });
    }
}
