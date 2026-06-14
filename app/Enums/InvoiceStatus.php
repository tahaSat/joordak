<?php

namespace App\Enums;

enum InvoiceStatus: string
{
    case PendingPayment = 'pending_payment';
    case ProcessingPayment = 'processing_payment';
    case Paid = 'paid';
    case DeliveredToPost = 'delivered_to_post';
    case Failed = 'failed';
    case Cancelled = 'cancelled';

    public function labelFa(): string
    {
        return match ($this) {
            self::PendingPayment => 'در انتظار پرداخت',
            self::ProcessingPayment => 'در حال پردازش پرداخت',
            self::Paid => 'پرداخت شده',
            self::DeliveredToPost => 'تحویل پست داده شده',
            self::Failed => 'ناموفق',
            self::Cancelled => 'لغو شده',
        };
    }

    public function canBePaid(): bool
    {
        return in_array($this, [
            self::PendingPayment,
            self::ProcessingPayment,
            self::Failed,
        ], true);
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
