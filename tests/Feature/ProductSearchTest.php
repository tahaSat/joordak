<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ProductSearchTest extends TestCase
{
    use RefreshDatabase;

    public function test_suggestions_match_product_and_category_names_and_exclude_inactive_products(): void
    {
        $category = Category::query()->create([
            'name' => 'گردنبند سنگی',
            'slug' => 'stone-necklace',
        ]);
        Product::query()->create([
            'category_id' => $category->id,
            'title' => 'محصول دسته بندی شده',
            'slug' => 'categorized-product',
            'is_active' => true,
        ]);
        Product::query()->create([
            'title' => 'گردنبند نقره',
            'slug' => 'silver-necklace',
            'is_active' => true,
        ]);
        Product::query()->create([
            'title' => 'گردنبند غیرفعال',
            'slug' => 'inactive-necklace',
            'is_active' => false,
        ]);

        $this->getJson(route('products.search.suggestions', ['search' => 'گردنبند']))
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonFragment(['title' => 'محصول دسته بندی شده'])
            ->assertJsonFragment(['title' => 'گردنبند نقره'])
            ->assertJsonMissing(['title' => 'گردنبند غیرفعال']);
    }

    public function test_suggestions_are_limited_to_three_products(): void
    {
        foreach (range(1, 4) as $number) {
            Product::query()->create([
                'title' => "گردنبند {$number}",
                'slug' => "necklace-{$number}",
                'is_active' => true,
            ]);
        }

        $this->getJson(route('products.search.suggestions', ['search' => 'گردنبند']))
            ->assertOk()
            ->assertJsonCount(3, 'data');
    }

    public function test_product_listing_search_is_combined_with_the_selected_category(): void
    {
        $matchingCategory = Category::query()->create([
            'name' => 'انگشتر',
            'slug' => 'rings',
        ]);
        $otherCategory = Category::query()->create([
            'name' => 'گردنبند',
            'slug' => 'necklaces',
        ]);
        Product::query()->create([
            'category_id' => $matchingCategory->id,
            'title' => 'انگشتر نقره',
            'slug' => 'silver-ring',
            'is_active' => true,
        ]);
        Product::query()->create([
            'category_id' => $otherCategory->id,
            'title' => 'محصول دیگر',
            'slug' => 'other-product',
            'is_active' => true,
        ]);
        Product::query()->create([
            'title' => 'انگشتر نقره غیرفعال',
            'slug' => 'inactive-silver-ring',
            'is_active' => false,
        ]);

        $this->get(route('products.index', ['search' => 'انگشتر', 'category' => $otherCategory->slug]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Products/Index')
                ->where('search', 'انگشتر')
                ->where('products.total', 0));

        $this->get(route('products.index', ['search' => 'نقره']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Products/Index')
                ->where('products.total', 1)
                ->where('products.data.0.title', 'انگشتر نقره'));
    }

    public function test_listing_pagination_keeps_the_search_query(): void
    {
        foreach (range(1, 11) as $number) {
            Product::query()->create([
                'title' => "Silver item {$number}",
                'slug' => "silver-item-{$number}",
                'is_active' => true,
            ]);
        }

        $this->get(route('products.index', ['search' => 'silver']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Products/Index')
                ->where('products.total', 11)
                ->where('products.next_page_url', fn ($url): bool => is_string($url) && str_contains($url, 'search=silver')));
    }
}