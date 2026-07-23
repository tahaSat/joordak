<?php

namespace App\Http\Controllers\Admin;

use App\Enums\InvoiceStatus;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Morilog\Jalali\Jalalian;

class StatsController extends Controller
{
    private const STATS_TIMEZONE = 'Asia/Tehran';

    public function __invoke(Request $request): Response
    {
        Gate::authorize('viewAny', Invoice::class);

        $jalaliMonth = $this->resolveJalaliMonth($request->query('month'));
        $year = $jalaliMonth->getYear();
        $month = $jalaliMonth->getMonth();
        $daysInMonth = $jalaliMonth->getMonthDays();

        $start = $this->jalaliDateToUtc($year, $month, 1, false);
        $end = $this->jalaliDateToUtc($year, $month, $daysInMonth, true);
        $createdAtDay = $this->tehranDateExpression('created_at');
        $paidInvoiceDay = $this->tehranDateExpression('paid_at');
        $purchasedAtDay = $this->tehranDateExpression('COALESCE(paid_at, created_at)');
        $updatedAtDay = $this->tehranDateExpression('updated_at');
        $expiredAtDay = $this->tehranDateExpression('COALESCE(failed_at, updated_at)');

        // Day zero represents the opening of the selected Jalali month.
        $labels = ['0'];
        for ($day = 1; $day <= $daysInMonth; $day++) {
            $labels[] = (string) $day;
        }

        $newUsers = $this->fillDailySeries(
            $this->dailyCounts(
                User::query()
                    ->whereBetween('created_at', [$start, $end])
                    ->selectRaw("{$createdAtDay} as day, COUNT(*) as value")
                    ->groupByRaw($createdAtDay)
                    ->pluck('value', 'day')
                    ->all(),
                $year,
                $month,
            ),
            $daysInMonth,
        );

        $allUsers = [];
        $usersBeforeMonth = User::query()->where('created_at', '<', $start)->count();
        $runningUsers = $usersBeforeMonth;
        foreach ($newUsers as $dailyNewUsers) {
            $runningUsers += $dailyNewUsers;
            $allUsers[] = $runningUsers;
        }

        $usersWithPurchase = $this->fillDailySeries(
            $this->dailyCounts(
                Payment::query()
                    ->where('status', PaymentStatus::Paid)
                    ->whereRaw('COALESCE(paid_at, created_at) BETWEEN ? AND ?', [$start, $end])
                    ->selectRaw("{$purchasedAtDay} as day, COUNT(DISTINCT user_id) as value")
                    ->groupByRaw($purchasedAtDay)
                    ->pluck('value', 'day')
                    ->all(),
                $year,
                $month,
            ),
            $daysInMonth,
        );

        $paidInvoices = $this->fillDailySeries(
            $this->dailyCounts(
                Payment::query()
                    ->where('status', PaymentStatus::Paid)
                    ->whereRaw('COALESCE(paid_at, created_at) BETWEEN ? AND ?', [$start, $end])
                    ->selectRaw("{$purchasedAtDay} as day, COUNT(DISTINCT invoice_id) as value")
                    ->groupByRaw($purchasedAtDay)
                    ->pluck('value', 'day')
                    ->all(),
                $year,
                $month,
            ),
            $daysInMonth,
        );

        $deliveredInvoices = $this->fillDailySeries(
            $this->dailyCounts(
                Invoice::query()
                    ->where('status', InvoiceStatus::DeliveredToPost)
                    ->whereBetween('updated_at', [$start, $end])
                    ->selectRaw("{$updatedAtDay} as day, COUNT(*) as value")
                    ->groupByRaw($updatedAtDay)
                    ->pluck('value', 'day')
                    ->all(),
                $year,
                $month,
            ),
            $daysInMonth,
        );

        $expiredPayments = $this->fillDailySeries(
            $this->dailyCounts(
                Payment::query()
                    ->where('status', PaymentStatus::Expired)
                    ->whereRaw('COALESCE(failed_at, updated_at) BETWEEN ? AND ?', [$start, $end])
                    ->selectRaw("{$expiredAtDay} as day, COUNT(*) as value")
                    ->groupByRaw($expiredAtDay)
                    ->pluck('value', 'day')
                    ->all(),
                $year,
                $month,
            ),
            $daysInMonth,
        );

        $dailyIncome = $this->fillDailySeries(
            $this->dailyCounts(
                Payment::query()
                    ->where('status', PaymentStatus::Paid)
                    ->whereBetween('paid_at', [$start, $end])
                    ->selectRaw("{$paidInvoiceDay} as day, COALESCE(SUM(amount), 0) as value")
                    ->groupByRaw($paidInvoiceDay)
                    ->pluck('value', 'day')
                    ->all(),
                $year,
                $month,
            ),
            $daysInMonth,
        );

        $monthIncome = [];
        $running = 0;
        foreach ($dailyIncome as $amount) {
            $running += (int) $amount;
            $monthIncome[] = $running;
        }

        array_unshift($newUsers, 0);
        array_unshift($allUsers, $usersBeforeMonth);
        array_unshift($usersWithPurchase, 0);
        array_unshift($paidInvoices, 0);
        array_unshift($deliveredInvoices, 0);
        array_unshift($expiredPayments, 0);
        array_unshift($monthIncome, 0);

        return Inertia::render('Admin/Stats/Index', [
            'month' => sprintf('%04d-%02d', $year, $month),
            'monthLabel' => $this->toPersianDigits($jalaliMonth->format('F Y')),
            'yearOptions' => $this->yearOptions($year),
            'labels' => $labels,
            'series' => [
                'newUsers' => $newUsers,
                'allUsers' => $allUsers,
                'usersWithPurchase' => $usersWithPurchase,
                'paidInvoices' => $paidInvoices,
                'deliveredInvoices' => $deliveredInvoices,
                'expiredPayments' => $expiredPayments,
                'monthIncome' => $monthIncome,
            ],
            'seriesMeta' => [
                ['key' => 'newUsers', 'label' => 'کاربران جدید', 'scale' => 'count'],
                ['key' => 'allUsers', 'label' => 'کل کاربران', 'scale' => 'count'],
                ['key' => 'usersWithPurchase', 'label' => 'کاربران دارای سفارش', 'scale' => 'count'],
                ['key' => 'paidInvoices', 'label' => 'سفارش‌های پرداخت‌شده', 'scale' => 'count'],
                ['key' => 'deliveredInvoices', 'label' => 'سفارش‌های تحویل داده‌شده', 'scale' => 'count'],
                ['key' => 'expiredPayments', 'label' => 'پرداخت‌های منقضی‌شده', 'scale' => 'count'],
                ['key' => 'monthIncome', 'label' => 'درآمد ماه', 'scale' => 'money'],
            ],
        ]);
    }

    private function resolveJalaliMonth(mixed $month): Jalalian
    {
        if (is_string($month) && preg_match('/^\d{4}-\d{2}$/', $month) === 1) {
            [$year, $monthNumber] = array_map('intval', explode('-', $month));

            if ($monthNumber >= 1 && $monthNumber <= 12) {
                try {
                    return Jalalian::fromFormat('Y-m-d', sprintf('%04d-%02d-01', $year, $monthNumber));
                } catch (\Throwable) {
                    // fall through
                }
            }
        }

        $now = Jalalian::fromCarbon(now()->setTimezone(self::STATS_TIMEZONE));

        return Jalalian::fromFormat('Y-m-d', sprintf('%04d-%02d-01', $now->getYear(), $now->getMonth()));
    }

    private function jalaliDateToUtc(int $year, int $month, int $day, bool $endOfDay): Carbon
    {
        $gregorianDate = Jalalian::fromFormat(
            'Y-m-d',
            sprintf('%04d-%02d-%02d', $year, $month, $day),
        )->toCarbon()->format('Y-m-d');

        $date = Carbon::createFromFormat(
            'Y-m-d H:i:s',
            "{$gregorianDate} ".($endOfDay ? '23:59:59' : '00:00:00'),
            self::STATS_TIMEZONE,
        );

        return $date->utc();
    }

    private function tehranDateExpression(string $column): string
    {
        // Iran no longer observes DST; database timestamps are UTC.
        return "DATE(DATE_ADD({$column}, INTERVAL 210 MINUTE))";
    }

    /**
     * @return list<int>
     */
    private function yearOptions(int $selectedYear): array
    {
        $currentYear = Jalalian::fromCarbon(now()->setTimezone(self::STATS_TIMEZONE))->getYear();
        $earliestTimestamp = collect([
            User::query()->min('created_at'),
            Invoice::query()->min('created_at'),
            Payment::query()->min('created_at'),
        ])->filter()->min();

        $earliestYear = $earliestTimestamp
            ? Jalalian::fromCarbon(
                Carbon::parse((string) $earliestTimestamp, 'UTC')->setTimezone(self::STATS_TIMEZONE),
            )->getYear()
            : $currentYear - 5;

        $firstYear = min($earliestYear, $selectedYear);
        $lastYear = max($currentYear + 1, $selectedYear);

        return range($lastYear, $firstYear);
    }

    /**
     * @param  array<string|int, mixed>  $raw
     * @return array<string, int>
     */
    private function dailyCounts(array $raw, int $jalaliYear, int $jalaliMonth): array
    {
        $mapped = [];

        foreach ($raw as $day => $value) {
            $localDate = Carbon::createFromFormat('Y-m-d', (string) $day, self::STATS_TIMEZONE);
            $jalali = Jalalian::fromCarbon($localDate);

            if ($jalali->getYear() !== $jalaliYear || $jalali->getMonth() !== $jalaliMonth) {
                continue;
            }

            $mapped[(string) $jalali->getDay()] = (int) $value;
        }

        return $mapped;
    }

    /**
     * @param  array<string, int>  $byDay
     * @return list<int>
     */
    private function fillDailySeries(array $byDay, int $daysInMonth): array
    {
        $series = [];

        for ($day = 1; $day <= $daysInMonth; $day++) {
            $series[] = $byDay[(string) $day] ?? 0;
        }

        return $series;
    }

    private function toPersianDigits(string $value): string
    {
        return strtr($value, [
            '0' => '۰',
            '1' => '۱',
            '2' => '۲',
            '3' => '۳',
            '4' => '۴',
            '5' => '۵',
            '6' => '۶',
            '7' => '۷',
            '8' => '۸',
            '9' => '۹',
        ]);
    }
}
