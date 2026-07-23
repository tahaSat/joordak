<?php

namespace App\Enums;

enum PaymentStatus: string
{
    case Pending = 'pending';
    case Processing = 'processing';
    case Paid = 'paid';
    case Failed = 'failed';
    case Cancelled = 'cancelled';
    case Expired = 'expired';

    public function labelFa(): string
    {
        return match ($this) {
            self::Pending => 'در انتظار شروع',
            self::Processing => 'در حال پردازش',
            self::Paid => 'پرداخت شده',
            self::Failed => 'ناموفق',
            self::Cancelled => 'لغو شده',
            self::Expired => 'منقضی شده',
        };
    }

    /**
     * @return array<string, string>
     */
    public static function labelsFa(): array
    {
        return collect(self::cases())
            ->mapWithKeys(fn (self $status): array => [$status->value => $status->labelFa()])
            ->all();
    }
}
