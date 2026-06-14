<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class VerifySubProductMigration extends Command
{
    protected $signature = 'joordak:verify-sub-products';

    protected $description = 'Verify sub-product migration integrity after Bluesheep parity upgrade';

    public function handle(): int
    {
        if (! Schema::hasTable('sub_products')) {
            $this->error('sub_products table does not exist. Run migrations first.');

            return self::FAILURE;
        }

        $productCount = DB::table('products')->count();
        $defaultSubProductCount = DB::table('sub_products')->where('sort_order', 0)->distinct()->count('product_id');
        $orphanCartItems = Schema::hasColumn('cart_items', 'sub_product_id')
            ? DB::table('cart_items')->whereNull('sub_product_id')->count()
            : 0;
        $orphanInvoiceItems = Schema::hasColumn('invoice_items', 'sub_product_id')
            ? DB::table('invoice_items')->whereNull('sub_product_id')->count()
            : 0;

        $this->table(['Check', 'Value'], [
            ['Products', $productCount],
            ['Default sub-products (sort_order=0)', $defaultSubProductCount],
            ['Cart items missing sub_product_id', $orphanCartItems],
            ['Invoice items missing sub_product_id', $orphanInvoiceItems],
        ]);

        if ($productCount !== $defaultSubProductCount) {
            $this->error('Mismatch: not every product has a default sub-product.');

            return self::FAILURE;
        }

        if ($orphanCartItems > 0 || $orphanInvoiceItems > 0) {
            $this->error('Orphan cart/invoice items found without sub_product_id.');

            return self::FAILURE;
        }

        $this->info('Sub-product migration verification passed.');

        return self::SUCCESS;
    }
}
