<?php

namespace App\Models;

use App\Enums\InvoiceStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'total',
        'subtotal',
        'discount_code_id',
        'discount_code',
        'invoice_discount_amount',
        'shipping_cost',
        'address',
        'postal_code',
        'status',
        'payment_reference',
        'post_tracking_code',
        'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'total' => 'integer',
            'subtotal' => 'integer',
            'invoice_discount_amount' => 'integer',
            'shipping_cost' => 'integer',
            'status' => InvoiceStatus::class,
            'paid_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function discountCode(): BelongsTo
    {
        return $this->belongsTo(DiscountCode::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function latestPayment(): HasOne
    {
        return $this->hasOne(Payment::class)->latestOfMany();
    }
}
