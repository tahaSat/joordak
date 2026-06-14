<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('sub_products')) {
            Schema::create('sub_products', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('product_id')->constrained()->cascadeOnDelete();
                $table->decimal('price', 15, 0)->default(0);
                $table->unsignedInteger('stock')->default(0);
                $table->string('size', 100)->nullable();
                $table->string('color_name', 100)->nullable();
                $table->string('color_hex', 7)->nullable();
                $table->json('photo_urls')->nullable();
                $table->unsignedInteger('sort_order')->default(0);
                $table->timestamps();
            });
        }

        $hasPrice = Schema::hasColumn('products', 'price');
        $hasStock = Schema::hasColumn('products', 'stock');
        $hasPhotoUrls = Schema::hasColumn('products', 'photo_urls');
        $hasSize = Schema::hasColumn('products', 'size');
        $hasColorName = Schema::hasColumn('products', 'color_name');
        $hasColorHex = Schema::hasColumn('products', 'color_hex');

        if ($hasPrice || $hasStock) {
            DB::table('products')
                ->orderBy('id')
                ->select([
                    'id',
                    ...($hasPrice ? ['price'] : []),
                    ...($hasStock ? ['stock'] : []),
                    ...($hasPhotoUrls ? ['photo_urls'] : []),
                    ...($hasSize ? ['size'] : []),
                    ...($hasColorName ? ['color_name'] : []),
                    ...($hasColorHex ? ['color_hex'] : []),
                ])
                ->chunkById(100, function ($products) use ($hasPhotoUrls, $hasSize, $hasColorName, $hasColorHex, $hasPrice, $hasStock): void {
                    $now = now();
                    $rows = $products
                        ->filter(fn ($product): bool => ! DB::table('sub_products')->where('product_id', $product->id)->where('sort_order', 0)->exists())
                        ->map(fn ($product): array => [
                            'product_id' => $product->id,
                            'price' => $hasPrice ? ($product->price ?? 0) : 0,
                            'stock' => $hasStock ? ($product->stock ?? 0) : 0,
                            'size' => $hasSize ? $product->size : null,
                            'color_name' => $hasColorName ? $product->color_name : null,
                            'color_hex' => $hasColorHex ? $product->color_hex : null,
                            'photo_urls' => $hasPhotoUrls ? $product->photo_urls : null,
                            'sort_order' => 0,
                            'created_at' => $now,
                            'updated_at' => $now,
                        ])
                        ->values()
                        ->all();

                    if ($rows !== []) {
                        DB::table('sub_products')->insert($rows);
                    }
                });
        }

        if (! Schema::hasColumn('cart_items', 'sub_product_id')) {
            Schema::table('cart_items', function (Blueprint $table): void {
                $table->foreignId('sub_product_id')->nullable()->after('product_id')->constrained('sub_products')->cascadeOnDelete();
            });
        }

        DB::table('cart_items')
            ->whereNull('cart_items.sub_product_id')
            ->orderBy('id')
            ->select(['id', 'product_id'])
            ->chunkById(100, function ($items): void {
                foreach ($items as $item) {
                    $subProductId = DB::table('sub_products')
                        ->where('product_id', $item->product_id)
                        ->where('sort_order', 0)
                        ->value('id');

                    if ($subProductId) {
                        DB::table('cart_items')->where('id', $item->id)->update(['sub_product_id' => $subProductId]);
                    }
                }
            });

        try {
            Schema::table('cart_items', function (Blueprint $table): void {
                $table->index('user_id', 'cart_items_user_id_subproduct_migration_index');
                $table->index('product_id', 'cart_items_product_id_subproduct_migration_index');
            });
        } catch (Throwable) {
            //
        }

        try {
            Schema::table('cart_items', function (Blueprint $table): void {
                $table->dropUnique(['user_id', 'product_id']);
            });
        } catch (Throwable) {
            //
        }

        try {
            Schema::table('cart_items', function (Blueprint $table): void {
                $table->unique(['user_id', 'sub_product_id']);
            });
        } catch (Throwable) {
            //
        }

        if (! Schema::hasColumn('invoice_items', 'sub_product_id')) {
            Schema::table('invoice_items', function (Blueprint $table): void {
                $table->foreignId('sub_product_id')->nullable()->after('product_id')->constrained('sub_products')->nullOnDelete();
            });
        }

        DB::table('invoice_items')
            ->whereNull('invoice_items.sub_product_id')
            ->orderBy('id')
            ->select(['id', 'product_id'])
            ->chunkById(100, function ($items): void {
                foreach ($items as $item) {
                    $subProductId = DB::table('sub_products')
                        ->where('product_id', $item->product_id)
                        ->where('sort_order', 0)
                        ->value('id');

                    if ($subProductId) {
                        DB::table('invoice_items')->where('id', $item->id)->update(['sub_product_id' => $subProductId]);
                    }
                }
            });

        Schema::table('products', function (Blueprint $table) use ($hasPhotoUrls, $hasSize, $hasColorName, $hasColorHex, $hasPrice, $hasStock): void {
            if ($hasPhotoUrls) {
                $table->dropColumn('photo_urls');
            }

            if ($hasSize) {
                $table->dropColumn('size');
            }

            if ($hasColorName) {
                $table->dropColumn('color_name');
            }

            if ($hasColorHex) {
                $table->dropColumn('color_hex');
            }

            if ($hasPrice) {
                $table->dropColumn('price');
            }

            if ($hasStock) {
                $table->dropColumn('stock');
            }
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table): void {
            $table->decimal('price', 15, 0)->default(0)->after('description');
            $table->unsignedInteger('stock')->default(0)->after('price');
            $table->json('photo_urls')->nullable()->after('image_url');
            $table->string('size', 100)->nullable()->after('stock');
            $table->string('color_name', 100)->nullable()->after('size');
            $table->string('color_hex', 7)->nullable()->after('color_name');
        });

        DB::table('products')
            ->join('sub_products', 'products.id', '=', 'sub_products.product_id')
            ->where('sub_products.sort_order', 0)
            ->update([
                'products.price' => DB::raw('sub_products.price'),
                'products.stock' => DB::raw('sub_products.stock'),
                'products.photo_urls' => DB::raw('sub_products.photo_urls'),
                'products.size' => DB::raw('sub_products.size'),
                'products.color_name' => DB::raw('sub_products.color_name'),
                'products.color_hex' => DB::raw('sub_products.color_hex'),
            ]);

        Schema::table('cart_items', function (Blueprint $table): void {
            $table->dropUnique(['user_id', 'sub_product_id']);
            $table->unique(['user_id', 'product_id']);
            $table->dropConstrainedForeignId('sub_product_id');
        });

        Schema::table('invoice_items', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('sub_product_id');
        });

        Schema::dropIfExists('sub_products');
    }
};
