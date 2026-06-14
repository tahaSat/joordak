<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SharedCart extends Model
{
    use HasFactory;

    protected $fillable = [
        'created_by_user_id',
        'token',
        'claimed_count',
    ];

    protected function casts(): array
    {
        return [
            'claimed_count' => 'integer',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'token';
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(SharedCartItem::class);
    }
}
