<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvoiceItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_id',
        'product_id',
        'sub_product_id',
        'product_name',
        'unit_price',
        'original_unit_price',
        'product_discount_amount',
        'quantity',
        'line_total',
    ];

    protected function casts(): array
    {
        return [
            'unit_price' => 'integer',
            'original_unit_price' => 'integer',
            'product_discount_amount' => 'integer',
            'line_total' => 'integer',
        ];
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
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
