<?php

namespace Tests\Feature;

use App\Models\CartItem;
use App\Models\Product;
use App\Models\SharedCart;
use App\Models\SubProduct;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SharedCartTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_shared_cart_link_and_cart_is_cleared(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        [$product, $subProduct] = $this->createProductWithVariant();

        CartItem::query()->create([
            'user_id' => $admin->id,
            'product_id' => $product->id,
            'sub_product_id' => $subProduct->id,
            'quantity' => 2,
            'unit_price' => 120000,
        ]);

        $response = $this
            ->actingAs($admin)
            ->from(route('cart.index'))
            ->post(route('admin.shared-carts.store'));

        $response
            ->assertSessionHasNoErrors()
            ->assertSessionHas('shared_cart_url')
            ->assertRedirect(route('cart.index', absolute: false));

        $sharedCart = SharedCart::query()->firstOrFail();

        $this->assertSame($admin->id, $sharedCart->created_by_user_id);
        $this->assertSame(0, $admin->cartItems()->count());
        $this->assertDatabaseHas('shared_cart_items', [
            'shared_cart_id' => $sharedCart->id,
            'product_id' => $product->id,
            'sub_product_id' => $subProduct->id,
            'quantity' => 2,
        ]);
    }

    public function test_non_admin_cannot_create_shared_cart_link(): void
    {
        $customer = User::factory()->create();

        $this
            ->actingAs($customer)
            ->post(route('admin.shared-carts.store'))
            ->assertForbidden();
    }

    public function test_guest_opening_shared_cart_link_redirects_to_login(): void
    {
        $sharedCart = SharedCart::query()->create([
            'token' => 'shared-token',
        ]);

        $this
            ->get(route('shared-carts.show', $sharedCart))
            ->assertRedirect(route('login'));
    }

    public function test_shared_cart_link_replaces_existing_cart_and_is_reusable(): void
    {
        [$product, $subProduct] = $this->createProductWithVariant(stock: 5);
        [$oldProduct, $oldSubProduct] = $this->createProductWithVariant(title: 'Old Item', slug: 'old-item');
        $sharedCart = SharedCart::query()->create([
            'token' => 'shared-token',
        ]);
        $sharedCart->items()->create([
            'product_id' => $product->id,
            'sub_product_id' => $subProduct->id,
            'quantity' => 2,
            'unit_price' => 120000,
        ]);

        $firstCustomer = User::factory()->create();
        CartItem::query()->create([
            'user_id' => $firstCustomer->id,
            'product_id' => $oldProduct->id,
            'sub_product_id' => $oldSubProduct->id,
            'quantity' => 1,
            'unit_price' => 90000,
        ]);

        $this
            ->actingAs($firstCustomer)
            ->get(route('shared-carts.show', $sharedCart))
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('cart.index', absolute: false));

        $this->assertDatabaseMissing('cart_items', [
            'user_id' => $firstCustomer->id,
            'sub_product_id' => $oldSubProduct->id,
        ]);
        $this->assertDatabaseHas('cart_items', [
            'user_id' => $firstCustomer->id,
            'product_id' => $product->id,
            'sub_product_id' => $subProduct->id,
            'quantity' => 2,
        ]);

        $secondCustomer = User::factory()->create();

        $this
            ->actingAs($secondCustomer)
            ->get(route('shared-carts.show', $sharedCart))
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('cart.index', absolute: false));

        $this->assertDatabaseHas('cart_items', [
            'user_id' => $secondCustomer->id,
            'product_id' => $product->id,
            'sub_product_id' => $subProduct->id,
            'quantity' => 2,
        ]);
        $this->assertSame(2, $sharedCart->refresh()->claimed_count);
    }

    /**
     * @return array{0: Product, 1: SubProduct}
     */
    private function createProductWithVariant(
        string $title = 'Piercing',
        string $slug = 'piercing',
        int $stock = 10,
    ): array {
        $product = Product::query()->create([
            'title' => $title,
            'slug' => $slug,
            'is_active' => true,
        ]);

        $subProduct = SubProduct::query()->create([
            'product_id' => $product->id,
            'price' => 120000,
            'stock' => $stock,
            'size' => 'M',
            'color_name' => 'Silver',
            'color_hex' => '#cccccc',
            'sort_order' => 0,
        ]);

        return [$product, $subProduct];
    }
}
