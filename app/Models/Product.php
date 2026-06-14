<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'title',
        'slug',
        'excerpt',
        'description',
        'image_url',
        'is_active',
    ];
 
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function cartItems(): HasMany
    {
        return $this->hasMany(CartItem::class);
    }

    public function invoiceItems(): HasMany
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function subProducts(): HasMany
    {
        return $this->hasMany(SubProduct::class)->orderBy('sort_order')->orderBy('id');
    }

    /**
     * @param Builder<Product> $query
     * @return Builder<Product>
     */
    public function scopeInStockFirst(Builder $query): Builder
    {
        return $query->orderByRaw(
            'CASE WHEN EXISTS (SELECT 1 FROM sub_products WHERE sub_products.product_id = products.id AND sub_products.stock > 0) THEN 0 ELSE 1 END'
        );
    }
}
