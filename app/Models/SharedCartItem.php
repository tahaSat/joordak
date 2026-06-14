<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SharedCartItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'shared_cart_id',
        'product_id',
        'sub_product_id',
        'quantity',
        'unit_price',
    ];

    protected function casts(): array
    {
        return [
            'unit_price' => 'integer',
        ];
    }

    public function sharedCart(): BelongsTo
    {
        return $this->belongsTo(SharedCart::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function subProduct(): BelongsTo
    {
        return $this->belongsTo(SubProduct::class);
    }
}
