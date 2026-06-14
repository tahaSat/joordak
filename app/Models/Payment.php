<?php

namespace App\Models;

use App\Enums\PaymentStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_id',
        'user_id',
        'gateway',
        'amount',
        'currency',
        'status',
        'gateway_track_id',
        'gateway_order_id',
        'gateway_ref_number',
        'card_number',
        'hashed_card_number',
        'requested_at',
        'paid_at',
        'verified_at',
        'failed_at',
        'last_checked_at',
        'attempt_count',
        'request_payload',
        'callback_payload',
        'verify_payload',
        'inquiry_payload',
        'failure_message',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'integer',
            'status' => PaymentStatus::class,
            'requested_at' => 'datetime',
            'paid_at' => 'datetime',
            'verified_at' => 'datetime',
            'failed_at' => 'datetime',
            'last_checked_at' => 'datetime',
            'request_payload' => 'array',
            'callback_payload' => 'array',
            'verify_payload' => 'array',
            'inquiry_payload' => 'array',
        ];
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isOpen(): bool
    {
        return in_array($this->status, [PaymentStatus::Pending, PaymentStatus::Processing], true);
    }
}
