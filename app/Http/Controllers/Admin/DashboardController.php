<?php

namespace App\Http\Controllers\Admin;

use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\BlogPost;
use App\Models\Category;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Product;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Morilog\Jalali\Jalalian;

class DashboardController extends Controller
{
    private const STATS_TIMEZONE = 'Asia/Tehran';

    public function __invoke(): Response
    {
        Gate::authorize('viewAny', Invoice::class);

        $jalaliNow = Jalalian::fromCarbon(now()->setTimezone(self::STATS_TIMEZONE));
        $currentYear = $jalaliNow->getYear();
        $currentMonth = $jalaliNow->getMonth();
        $previousYear = $currentMonth === 1 ? $currentYear - 1 : $currentYear;
        $previousMonth = $currentMonth === 1 ? 12 : $currentMonth - 1;

        [$currentStart, $currentEnd] = $this->jalaliMonthRange($currentYear, $currentMonth);
        [$previousStart] = $this->jalaliMonthRange($previousYear, $previousMonth);
        $previousMonthFirstDay = Jalalian::fromFormat(
            'Y-m-d',
            sprintf('%04d-%02d-01', $previousYear, $previousMonth),
        );
        $previousComparableDay = min($jalaliNow->getDay(), $previousMonthFirstDay->getMonthDays());
        $previousComparableEnd = $this->jalaliDateToUtc(
            Jalalian::fromFormat(
                'Y-m-d',
                sprintf('%04d-%02d-%02d', $previousYear, $previousMonth, $previousComparableDay),
            ),
            true,
        );

        $currentUsers = User::query()->whereBetween('created_at', [$currentStart, $currentEnd])->count();
        $previousUsers = User::query()->whereBetween('created_at', [$previousStart, $previousComparableEnd])->count();
        $currentInvoices = Invoice::query()->whereBetween('created_at', [$currentStart, $currentEnd])->count();
        $previousInvoices = Invoice::query()->whereBetween('created_at', [$previousStart, $previousComparableEnd])->count();
        $currentRevenue = (float) Payment::query()
            ->where('status', PaymentStatus::Paid)
            ->whereBetween('paid_at', [$currentStart, $currentEnd])
            ->sum('amount');
        $previousComparableRevenue = (float) Payment::query()
            ->where('status', PaymentStatus::Paid)
            ->whereBetween('paid_at', [$previousStart, $previousComparableEnd])
            ->sum('amount');

        return Inertia::render('Admin/Dashboard/Index', [
            'stats' => [
                'products' => Product::query()->count(),
                'categories' => Category::query()->count(),
                'blogPosts' => BlogPost::query()->count(),
                'users' => $currentUsers,
                'usersChange' => $this->percentageChange($currentUsers, $previousUsers),
                'invoices' => $currentInvoices,
                'invoicesChange' => $this->percentageChange($currentInvoices, $previousInvoices),
                'revenue' => $currentRevenue,
                'revenueChange' => $this->percentageChange($currentRevenue, $previousComparableRevenue),
            ],
            'recentInvoices' => Invoice::query()
                ->with('user')
                ->latest()
                ->take(5)
                ->get()
                ->map(fn (Invoice $invoice): array => $this->invoiceSummary($invoice)),
        ]);
    }

    /**
     * @return array{0: Carbon, 1: Carbon}
     */
    private function jalaliMonthRange(int $year, int $month): array
    {
        $firstDay = Jalalian::fromFormat('Y-m-d', sprintf('%04d-%02d-01', $year, $month));
        $lastDay = Jalalian::fromFormat(
            'Y-m-d',
            sprintf('%04d-%02d-%02d', $year, $month, $firstDay->getMonthDays()),
        );

        return [
            $this->jalaliDateToUtc($firstDay, false),
            $this->jalaliDateToUtc($lastDay, true),
        ];
    }

    private function jalaliDateToUtc(Jalalian $date, bool $endOfDay): Carbon
    {
        $gregorianDate = $date->toCarbon()->format('Y-m-d');
        $time = $endOfDay ? '23:59:59' : '00:00:00';

        return Carbon::createFromFormat(
            'Y-m-d H:i:s',
            "{$gregorianDate} {$time}",
            self::STATS_TIMEZONE,
        )->utc();
    }

    private function percentageChange(int|float $current, int|float $previous): float
    {
        if ((float) $previous === 0.0) {
            return (float) $current === 0.0 ? 0 : 100;
        }

        return round((($current - $previous) / $previous) * 100, 1);
    }

    /**
     * @return array<string, mixed>
     */
    private function invoiceSummary(Invoice $invoice): array
    {
        return [
            'id' => $invoice->id,
            'status' => $invoice->status->value,
            'total' => (float) $invoice->total,
            'created_at' => $invoice->created_at?->toISOString(),
            'customer_name' => trim(($invoice->user?->name ?? '').' '.($invoice->user?->surname ?? '')),
            'customer_phone' => $invoice->user?->phone,
        ];
    }
}
