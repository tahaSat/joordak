import AdminCard from '@/Components/Admin/AdminCard';
import AdminPageHeader from '@/Components/Admin/AdminPageHeader';
import AdminLayout from '@/Layouts/AdminLayout';
import { formatNumberFa, formatPrice } from '@/lib/format';
import { router } from '@inertiajs/react';
import {
    IconArrowsMaximize,
    IconArrowsMinimize,
    IconCheck,
    IconChevronDown,
    IconChevronLeft,
    IconChevronRight,
    IconPlus,
    IconX,
} from '@tabler/icons-react';
import {
    CategoryScale,
    Chart as ChartJS,
    Filler,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Tooltip,
    type ChartData,
    type ChartOptions,
    type TooltipItem,
} from 'chart.js';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

type SeriesKey =
    | 'newUsers'
    | 'allUsers'
    | 'usersWithPurchase'
    | 'paidInvoices'
    | 'deliveredInvoices'
    | 'expiredPayments'
    | 'monthIncome';

interface SeriesMeta {
    key: SeriesKey;
    label: string;
    scale: 'count' | 'money';
}

interface StatsProps {
    month: string;
    yearOptions: number[];
    labels: string[];
    series: Record<SeriesKey, number[]>;
    seriesMeta: SeriesMeta[];
}

const SERIES_COLORS: Record<SeriesKey, string> = {
    newUsers: '#0ea5e9',
    allUsers: '#0f766e',
    usersWithPurchase: '#8b5cf6',
    paidInvoices: '#10b981',
    deliveredInvoices: '#f59e0b',
    expiredPayments: '#f43f5e',
    monthIncome: '#1c5872',
};

const JALALI_MONTHS = [
    'فروردین',
    'اردیبهشت',
    'خرداد',
    'تیر',
    'مرداد',
    'شهریور',
    'مهر',
    'آبان',
    'آذر',
    'دی',
    'بهمن',
    'اسفند',
];

export default function StatsIndex({ month, yearOptions, labels, series, seriesMeta }: StatsProps) {
    const [selectedKeys, setSelectedKeys] = useState<SeriesKey[]>(['monthIncome']);
    const [selectedYear, selectedMonth] = month.split('-').map(Number);
    const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
    const [pickerYear, setPickerYear] = useState(selectedYear);
    const [isMobileChart, setIsMobileChart] = useState(false);
    const [isPortrait, setIsPortrait] = useState(false);
    const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
    const [isChartFullscreen, setIsChartFullscreen] = useState(false);
    const monthPickerRef = useRef<HTMLDivElement>(null);

    const selectedMeta = useMemo(
        () => seriesMeta.filter((meta) => selectedKeys.includes(meta.key)),
        [selectedKeys, seriesMeta],
    );

    const toggleSeries = (key: SeriesKey) => {
        setSelectedKeys((current) => {
            if (current.includes(key)) {
                if (current.length === 1) {
                    return current;
                }

                return current.filter((item) => item !== key);
            }

            if (current.length >= 2) {
                return [current[1], key];
            }

            return [...current, key];
        });
    };

    const visitMonth = (nextMonth: string) => {
        router.get(route('admin.stats'), { month: nextMonth }, { preserveState: true, preserveScroll: true });
    };

    const visitJalaliDate = (year: number, monthNumber: number) => {
        setIsMonthPickerOpen(false);
        visitMonth(`${year}-${String(monthNumber).padStart(2, '0')}`);
    };

    useEffect(() => {
        setPickerYear(selectedYear);
    }, [selectedYear]);

    useEffect(() => {
        const mobileQuery = window.matchMedia('(max-width: 639px)');
        const portraitQuery = window.matchMedia('(orientation: portrait)');
        const updateViewportState = () => {
            setIsMobileChart(mobileQuery.matches);
            setIsPortrait(portraitQuery.matches);
        };

        updateViewportState();
        mobileQuery.addEventListener('change', updateViewportState);
        portraitQuery.addEventListener('change', updateViewportState);

        return () => {
            mobileQuery.removeEventListener('change', updateViewportState);
            portraitQuery.removeEventListener('change', updateViewportState);
        };
    }, []);

    useEffect(() => {
        if (!isMonthPickerOpen) {
            return;
        }

        const closeOnOutsideClick = (event: MouseEvent) => {
            if (!monthPickerRef.current?.contains(event.target as Node)) {
                setIsMonthPickerOpen(false);
            }
        };

        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsMonthPickerOpen(false);
            }
        };

        document.addEventListener('mousedown', closeOnOutsideClick);
        document.addEventListener('keydown', closeOnEscape);

        return () => {
            document.removeEventListener('mousedown', closeOnOutsideClick);
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, [isMonthPickerOpen]);

    useEffect(() => {
        if (!isFilterSheetOpen || !isMobileChart) {
            return;
        }

        const previousOverflow = document.body.style.overflow;
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsFilterSheetOpen(false);
            }
        };

        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', closeOnEscape);

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, [isFilterSheetOpen, isMobileChart]);

    useEffect(() => {
        if (!isChartFullscreen) {
            return;
        }

        const previousOverflow = document.body.style.overflow;
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !document.fullscreenElement) {
                setIsChartFullscreen(false);
            }
        };
        const closeAfterNativeFullscreen = () => {
            if (!document.fullscreenElement) {
                setIsChartFullscreen(false);
            }
        };

        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', closeOnEscape);
        document.addEventListener('fullscreenchange', closeAfterNativeFullscreen);

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', closeOnEscape);
            document.removeEventListener('fullscreenchange', closeAfterNativeFullscreen);
        };
    }, [isChartFullscreen]);

    const enterLandscapeMode = async () => {
        setIsFilterSheetOpen(false);
        setIsChartFullscreen(true);

        try {
            if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
                await document.documentElement.requestFullscreen();
            }
        } catch {
            // iOS does not support fullscreen on arbitrary elements; the fixed overlay remains available.
        }

        try {
            const orientation = screen.orientation as
                | (ScreenOrientation & {
                      lock?: (orientation: string) => Promise<void>;
                  })
                | undefined;
            await orientation?.lock?.('landscape');
        } catch {
            // The CSS fallback rotates the viewer when orientation locking is unavailable.
        }
    };

    const exitLandscapeMode = async () => {
        setIsChartFullscreen(false);

        const orientation = screen.orientation as
            | (ScreenOrientation & {
                  unlock?: () => void;
              })
            | undefined;
        orientation?.unlock?.();

        if (document.fullscreenElement) {
            await document.exitFullscreen().catch(() => undefined);
        }
    };

    const newestYear = Math.max(...yearOptions);
    const oldestYear = Math.min(...yearOptions);

    const chartData: ChartData<'line'> = useMemo(() => {
        const faLabels = labels.map((label) => Number(label).toLocaleString('fa-IR'));

        return {
            labels: faLabels,
            datasets: selectedMeta.map((meta, index) => {
                const color = SERIES_COLORS[meta.key];
                const yAxisID = index === 0 ? 'y' : 'y1';

                return {
                    label: meta.label,
                    data: series[meta.key],
                    borderColor: color,
                    backgroundColor: `${color}22`,
                    pointBackgroundColor: color,
                    pointBorderColor: '#fff',
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    borderWidth: 2.5,
                    tension: 0.35,
                    fill: false,
                    yAxisID,
                };
            }),
        };
    }, [labels, selectedMeta, series]);

    const chartOptions: ChartOptions<'line'> = useMemo(() => {
        const leftMeta = selectedMeta[0];
        const rightMeta = selectedMeta[1];

        const seriesMax = (meta: SeriesMeta | undefined): number => {
            if (!meta) {
                return 0;
            }

            return Math.max(0, ...series[meta.key]);
        };

        const allSelectedSeriesAreCounts = selectedMeta.every((meta) => meta.scale === 'count');
        const sharedCountMax = Math.max(1, ...selectedMeta.map((meta) => seriesMax(meta)));

        const axisBounds = (meta: SeriesMeta | undefined): { min: number; max: number } => {
            if (!meta) {
                return { min: 0, max: 1 };
            }

            const values = series[meta.key];
            const max = Math.max(0, ...values);

            if (meta.scale === 'money') {
                const min = Math.min(...values);

                // A constant series needs a non-zero range for Chart.js.
                if (min === max) {
                    return { min: 0, max: Math.max(max, 1) };
                }

                return { min, max };
            }

            return {
                min: 0,
                max: allSelectedSeriesAreCounts ? sharedCountMax : Math.max(max, 1),
            };
        };

        const integerTickConfig = (meta: SeriesMeta | undefined) => {
            if (!meta) {
                return {};
            }

            const bounds = axisBounds(meta);
            const range = bounds.max - bounds.min;

            return {
                precision: 0,
                stepSize: range <= 20 ? 1 : undefined,
                maxTicksLimit: range <= 20 ? range + 1 : 8,
            };
        };

        const tickFormatter = (meta: SeriesMeta | undefined) => (value: string | number) => {
            const numeric = Number(value);

            // Counts and payment amounts are integers. Fractional ticks would
            // round into repeated labels (for example, several 0s and 1s).
            if (!Number.isInteger(numeric)) {
                return '';
            }

            if (!meta || meta.scale === 'count') {
                return formatNumberFa(numeric);
            }

            return formatPrice(numeric);
        };

        return {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    display: false,
                },
                tooltip: {
                    rtl: true,
                    callbacks: {
                        label: (context: TooltipItem<'line'>) => {
                            const meta = selectedMeta[context.datasetIndex];
                            const value = Number(context.parsed.y ?? 0);
                            const formatted = meta?.scale === 'money' ? formatPrice(value) : formatNumberFa(value);

                            return `${meta?.label ?? context.dataset.label}: ${formatted}`;
                        },
                    },
                },
            },
            scales: {
                x: {
                    grid: {
                        color: (context) => {
                            const day = Number(labels[context.index]);

                            return !isMobileChart || day % 5 === 0
                                ? 'rgba(148, 163, 184, 0.2)'
                                : 'transparent';
                        },
                    },
                    ticks: {
                        color: '#64748b',
                        maxRotation: 0,
                        autoSkip: !isMobileChart,
                        maxTicksLimit: isMobileChart ? undefined : 16,
                        callback: (_value, index) => {
                            const day = Number(labels[index]);

                            if (isMobileChart && day % 5 !== 0) {
                                return '';
                            }

                            return day.toLocaleString('fa-IR');
                        },
                    },
                },
                y: {
                    type: 'linear',
                    position: 'left',
                    beginAtZero: leftMeta?.scale !== 'money',
                    ...axisBounds(leftMeta),
                    grid: {
                        color: 'rgba(148, 163, 184, 0.2)',
                    },
                    ticks: {
                        color: leftMeta ? SERIES_COLORS[leftMeta.key] : '#64748b',
                        callback: tickFormatter(leftMeta),
                        ...integerTickConfig(leftMeta),
                    },
                },
                y1: {
                    type: 'linear',
                    position: 'right',
                    display: Boolean(rightMeta),
                    beginAtZero: rightMeta?.scale !== 'money',
                    ...axisBounds(rightMeta),
                    grid: {
                        drawOnChartArea: false,
                    },
                    ticks: {
                        color: rightMeta ? SERIES_COLORS[rightMeta.key] : '#64748b',
                        callback: tickFormatter(rightMeta),
                        ...integerTickConfig(rightMeta),
                    },
                },
            },
        };
    }, [isMobileChart, labels, selectedMeta, series]);

    return (
        <AdminLayout title="آمار">
            <AdminPageHeader
                title="آمار"
                description="نمودار روزانه کاربران، سفارش‌ها و درآمد در ماه شمسی انتخاب‌شده."
                titleClassName="text-lg"
            />

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div ref={monthPickerRef} className="relative">
                    <button
                        type="button"
                        onClick={() => setIsMonthPickerOpen((open) => !open)}
                        aria-haspopup="dialog"
                        aria-expanded={isMonthPickerOpen}
                        className="inline-flex min-w-44 items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                    >
                        <span>
                            {JALALI_MONTHS[selectedMonth - 1]}{' '}
                            {selectedYear.toLocaleString('fa-IR', { useGrouping: false })}
                        </span>
                        <IconChevronDown
                            size={18}
                            className={`shrink-0 text-slate-400 transition ${isMonthPickerOpen ? 'rotate-180' : ''}`}
                        />
                    </button>

                    {isMonthPickerOpen && (
                        <div
                            role="dialog"
                            aria-label="انتخاب ماه و سال شمسی"
                            className="absolute right-0 top-full z-30 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl"
                        >
                            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                                <button
                                    type="button"
                                    onClick={() => setPickerYear((year) => Math.min(year + 1, newestYear))}
                                    disabled={pickerYear >= newestYear}
                                    aria-label="سال بعد"
                                    className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
                                >
                                    <IconChevronRight size={20} />
                                </button>
                                <span className="text-base font-black text-slate-900">
                                    {pickerYear.toLocaleString('fa-IR', { useGrouping: false })}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setPickerYear((year) => Math.max(year - 1, oldestYear))}
                                    disabled={pickerYear <= oldestYear}
                                    aria-label="سال قبل"
                                    className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
                                >
                                    <IconChevronLeft size={20} />
                                </button>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                {JALALI_MONTHS.map((monthName, index) => {
                                    const monthNumber = index + 1;
                                    const isSelected = pickerYear === selectedYear && monthNumber === selectedMonth;

                                    return (
                                        <button
                                            key={monthName}
                                            type="button"
                                            onClick={() => visitJalaliDate(pickerYear, monthNumber)}
                                            className={`relative rounded-xl px-2 py-2.5 text-sm font-bold transition ${
                                                isSelected
                                                    ? 'bg-slate-900 text-white shadow-sm'
                                                    : 'text-slate-700 hover:bg-slate-100'
                                            }`}
                                        >
                                            {monthName}
                                            {isSelected && (
                                                <IconCheck
                                                    size={13}
                                                    className="absolute left-1.5 top-1/2 -translate-y-1/2"
                                                />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <AdminCard>
                <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-start justify-between gap-3 lg:block">
                        <div>
                            <h2 className="text-base font-black text-slate-900">نمودار ماهانه</h2>
                            <p className="mt-1 text-xs text-slate-500">حداکثر دو سری را همزمان انتخاب کنید.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => void enterLandscapeMode()}
                            aria-label="نمای تمام‌صفحه افقی"
                            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-slate-300 text-slate-500 transition hover:border-slate-400 hover:bg-slate-50 sm:hidden"
                        >
                            <IconArrowsMaximize size={18} />
                        </button>
                    </div>
                    <div className="hidden max-w-3xl flex-wrap justify-start gap-2 sm:flex lg:justify-end">
                        {seriesMeta.map((meta) => {
                            const isSelected = selectedKeys.includes(meta.key);
                            const color = SERIES_COLORS[meta.key];

                            return (
                                <button
                                    key={meta.key}
                                    type="button"
                                    onClick={() => toggleSeries(meta.key)}
                                    className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
                                        isSelected
                                            ? 'text-white shadow-sm'
                                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                    }`}
                                    style={
                                        isSelected
                                            ? { backgroundColor: color, borderColor: color }
                                            : undefined
                                    }
                                >
                                    {meta.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="mb-3 flex flex-wrap items-center gap-2 sm:hidden">
                    {selectedMeta.map((meta) => {
                        const color = SERIES_COLORS[meta.key];

                        return (
                            <button
                                key={meta.key}
                                type="button"
                                onClick={() => toggleSeries(meta.key)}
                                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold"
                                style={{ borderColor: color, color }}
                            >
                                {meta.label}
                                {selectedKeys.length > 1 && <IconX size={14} />}
                            </button>
                        );
                    })}
                    <button
                        type="button"
                        onClick={() => setIsFilterSheetOpen(true)}
                        aria-label="افزودن نمودار"
                        className="inline-flex size-8 items-center justify-center rounded-full border border-dashed border-slate-300 text-slate-500 transition hover:border-slate-400 hover:bg-slate-50"
                    >
                        <IconPlus size={18} />
                    </button>
                </div>

                <div className="h-[300px] w-full sm:h-[420px]">
                    <Line data={chartData} options={chartOptions} />
                </div>
            </AdminCard>

            {isMobileChart && isFilterSheetOpen && (
                <div
                    className="fixed inset-0 z-50 bg-slate-950/40 sm:hidden"
                    role="dialog"
                    aria-modal="true"
                    aria-label="انتخاب نمودارها"
                    onClick={() => setIsFilterSheetOpen(false)}
                >
                    <div
                        className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 shadow-2xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200" />
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-black text-slate-900">انتخاب نمودارها</h3>
                                <p className="mt-1 text-xs text-slate-500">حداکثر دو مورد را انتخاب کنید.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsFilterSheetOpen(false)}
                                aria-label="بستن"
                                className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
                            >
                                <IconX size={20} />
                            </button>
                        </div>

                        <div className="grid max-h-[55vh] gap-2 overflow-y-auto">
                            {seriesMeta.map((meta) => {
                                const isSelected = selectedKeys.includes(meta.key);
                                const color = SERIES_COLORS[meta.key];

                                return (
                                    <button
                                        key={meta.key}
                                        type="button"
                                        onClick={() => toggleSeries(meta.key)}
                                        className="flex items-center justify-between rounded-xl border px-4 py-3 text-right text-sm font-bold transition"
                                        style={
                                            isSelected
                                                ? {
                                                      borderColor: color,
                                                      color,
                                                      backgroundColor: `${color}0d`,
                                                  }
                                                : {
                                                      borderColor: '#e2e8f0',
                                                      color: '#475569',
                                                  }
                                        }
                                    >
                                        <span>{meta.label}</span>
                                        <span
                                            className="inline-flex size-5 items-center justify-center rounded-full border"
                                            style={{ borderColor: isSelected ? color : '#cbd5e1' }}
                                        >
                                            {isSelected && <IconCheck size={13} />}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsFilterSheetOpen(false)}
                            className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white"
                        >
                            نمایش نمودار
                        </button>
                    </div>
                </div>
            )}

            {isChartFullscreen &&
                createPortal(
                    <div className="fixed inset-0 z-[70] overflow-hidden bg-white">
                        <div
                            className={
                                isPortrait
                                    ? 'absolute left-1/2 top-1/2 h-[100vw] w-[100vh] -translate-x-1/2 -translate-y-1/2 rotate-90 bg-white'
                                    : 'h-full w-full bg-white'
                            }
                        >
                            <div className="flex h-full flex-col p-3">
                                <div className="mb-2 flex shrink-0 items-center justify-between gap-3">
                                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                                        {selectedMeta.map((meta) => (
                                            <span
                                                key={meta.key}
                                                className="rounded-full border px-2.5 py-1 text-xs font-bold"
                                                style={{
                                                    borderColor: SERIES_COLORS[meta.key],
                                                    color: SERIES_COLORS[meta.key],
                                                }}
                                            >
                                                {meta.label}
                                            </span>
                                        ))}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => void exitLandscapeMode()}
                                        aria-label="خروج از تمام‌صفحه"
                                        className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-600"
                                    >
                                        <IconArrowsMinimize size={19} />
                                    </button>
                                </div>
                                <div className="min-h-0 flex-1">
                                    <Line data={chartData} options={chartOptions} />
                                </div>
                            </div>
                        </div>
                    </div>,
                    document.body,
                )}
        </AdminLayout>
    );
}
