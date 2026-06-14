<?php

namespace App\Enums;

enum DiscountType: string
{
    case Percent = 'percent';
    case Amount = 'amount';

    public function labelFa(): string
    {
        return match ($this) {
            self::Percent => 'درصدی',
            self::Amount => 'مبلغ ثابت',
        };
    }

    /**
     * @return array<string, string>
     */
    public static function labelsFa(): array
    {
        return collect(self::cases())
            ->mapWithKeys(fn (self $type): array => [$type->value => $type->labelFa()])
            ->all();
    }
}
