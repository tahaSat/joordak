<?php

namespace App\Models;

use App\Enums\DiscountType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SubProduct extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'price',
        'discount_type',
        'discount_value',
        'discount_starts_at',
        'discount_ends_at',
        'discount_usage_limit',
        'discount_used_count',
        'stock',
        'size',
        'color_name',
        'color_hex',
        'photo_urls',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'integer',
            'discount_type' => DiscountType::class,
            'discount_value' => 'integer',
            'discount_starts_at' => 'datetime',
            'discount_ends_at' => 'datetime',
            'discount_usage_limit' => 'integer',
            'discount_used_count' => 'integer',
            'photo_urls' => 'array',
            'sort_order' => 'integer',
        ];
    }

    /**
     * @param Builder<SubProduct> $query
     * @return Builder<SubProduct>
     */
    public function scopeWithActiveDiscount(Builder $query): Builder
    {
        $now = now();

        return $query
            ->whereNotNull('discount_type')
            ->whereNotNull('discount_value')
            ->where('discount_value', '>', 0)
            ->where(function (Builder $discountQuery) use ($now): void {
                $discountQuery
                    ->whereNull('discount_starts_at')
                    ->orWhere('discount_starts_at', '<=', $now);
            })
            ->where(function (Builder $discountQuery) use ($now): void {
                $discountQuery
                    ->whereNull('discount_ends_at')
                    ->orWhere('discount_ends_at', '>=', $now);
            })
            ->where(function (Builder $discountQuery): void {
                $discountQuery
                    ->whereNull('discount_usage_limit')
                    ->orWhereColumn('discount_used_count', '<', 'discount_usage_limit');
            });
    }

    public function hasActiveDiscount(): bool
    {
        if (! $this->discount_type || ! $this->discount_value) {
            return false;
        }

        $now = now();

        if ($this->discount_starts_at && $now->lt($this->discount_starts_at)) {
            return false;
        }

        if ($this->discount_ends_at && $now->gt($this->discount_ends_at)) {
            return false;
        }

        if ($this->discount_usage_limit !== null && $this->discount_used_count >= $this->discount_usage_limit) {
            return false;
        }

        return true;
    }

    public function discountAmount(): int
    {
        if (! $this->hasActiveDiscount()) {
            return 0;
        }

        $price = (int) $this->price;

        $reduction = $this->discount_type === DiscountType::Percent
            ? (int) floor($price * $this->discount_value / 100)
            : (int) $this->discount_value;

        return (int) max(0, min($reduction, $price));
    }

    public function discountedPrice(): int
    {
        return (int) max(0, (int) $this->price - $this->discountAmount());
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function cartItems(): HasMany
    {
        return $this->hasMany(CartItem::class);
    }

    public function invoiceItems(): HasMany
    {
        return $this->hasMany(InvoiceItem::class);
    }
}
