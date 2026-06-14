import AdminCard from '@/Components/Admin/AdminCard';
import AdminEmptyState from '@/Components/Admin/AdminEmptyState';
import AdminPageHeader from '@/Components/Admin/AdminPageHeader';
import AdminPagination from '@/Components/Admin/AdminPagination';
import AdminStatusBadge from '@/Components/Admin/AdminStatusBadge';
import AdminTable from '@/Components/Admin/AdminTable';
import Modal from '@/Components/Modal';
import AdminLayout from '@/Layouts/AdminLayout';
import { formatDateFa, formatPrice } from '@/lib/format';
import type { AdminInvoiceSummary, Paginated } from '@/types/admin';
import { Link, router } from '@inertiajs/react';
import { FormEvent, useState } from 'react';

interface InvoiceIndexProps {
    invoices: Paginated<AdminInvoiceSummary>;
    filters: {
        search?: string;
        status?: string;
        from?: string;
        until?: string;
    };
    statuses: Record<string, string>;
}

export default function InvoiceIndex({ invoices, filters, statuses }: InvoiceIndexProps) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [from, setFrom] = useState(filters.from ?? '');
    const [until, setUntil] = useState(filters.until ?? '');
    const [showFilters, setShowFilters] = useState(false);
    const appliedFilters = compactFilters(filters);
    const activeFilterCount = Object.keys(appliedFilters).length;

    function submit(event: FormEvent) {
        event.preventDefault();

        setShowFilters(false);
        router.get(route('admin.invoices.index'), compactFilters({ search, status, from, until }), {
            preserveState: true,
            preserveScroll: true,
        });
    }

    function openFilterModal() {
        setSearch(filters.search ?? '');
        setStatus(filters.status ?? '');
        setFrom(filters.from ?? '');
        setUntil(filters.until ?? '');
        setShowFilters(true);
    }

    function clearFilters() {
        setSearch('');
        setStatus('');
        setFrom('');
        setUntil('');
        setShowFilters(false);

        router.get(route('admin.invoices.index'), {}, {
            preserveState: true,
            preserveScroll: true,
        });
    }

    return (
        <AdminLayout title="سفارشات">
            <AdminPageHeader title="سفارشات" description="جستجو، فیلتر و مدیریت وضعیت سفارش‌ها." />

            <AdminCard className="mb-5">
                <div className="flex flex-col gap-2 md:flex-row">
                    <button type="button" onClick={openFilterModal} className="relative rounded-xl bg-joordak px-4 py-2 text-sm font-bold text-white md:flex-1">
                        فیلتر کردن
                        {activeFilterCount > 0 && (
                            <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-black text-white">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>
                    <a href={route('admin.invoices.export', appliedFilters)} className="rounded-xl border border-joordak px-4 py-2 text-center text-sm font-bold text-joordak-coral md:flex-1">
                        خروجی PDF سفارش‌ها
                    </a>
                </div>
            </AdminCard>

            <AdminCard>
                {invoices.data.length === 0 ? (
                    <AdminEmptyState message="سفارشی با این فیلترها پیدا نشد." />
                ) : (
                    <>
                        <AdminTable headers={['مشتری', 'وضعیت', 'مبلغ', 'تاریخ ثبت', '']}>
                            {invoices.data.map((invoice) => (
                                <tr
                                    key={invoice.id}
                                    onClick={() => router.visit(route('admin.invoices.show', invoice.id))}
                                    className="cursor-pointer transition hover:bg-slate-50"
                                >
                                    <td className="px-4 py-3">
                                        <div className="font-bold text-slate-800">{invoice.customer_name || 'بدون نام'}</div>
                                        <div className="text-xs text-slate-500">{invoice.customer_phone}</div>
                                    </td>
                                    <td className="px-4 py-3"><AdminStatusBadge status={invoice.status} /></td>
                                    <td className="whitespace-nowrap px-4 py-3 font-bold">{formatPrice(invoice.total)}</td>
                                    <td className="whitespace-nowrap px-4 py-3">{formatDateFa(invoice.created_at)}</td>
                                    <td className="whitespace-nowrap px-4 py-3">
                                        <Link href={route('admin.invoices.show', invoice.id)} onClick={(event) => event.stopPropagation()} className="font-bold text-joordak-coral">
                                            مشاهده
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </AdminTable>
                        <AdminPagination items={invoices} />
                    </>
                )}
            </AdminCard>

            <Modal show={showFilters} onClose={() => setShowFilters(false)} maxWidth="lg">
                <form onSubmit={submit} className="space-y-5 p-6">
                    <div>
                        <h2 className="text-xl font-black text-slate-900">فیلتر سفارش‌ها</h2>
                        <p className="mt-1 text-sm text-slate-500">فیلترهای مورد نظر را انتخاب کنید و نتیجه را روی لیست سفارش‌ها ببینید.</p>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="نام، نام خانوادگی یا موبایل" className="rounded-xl border-slate-200 text-sm md:col-span-2" />
                        <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl border-slate-200 text-sm">
                            <option value="">همه وضعیت‌ها</option>
                            {Object.entries(statuses).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                        <DateFilterInput label="از تاریخ" value={from} onChange={setFrom} />
                        <DateFilterInput label="تا تاریخ" value={until} onChange={setUntil} />
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                        <button type="submit" className="rounded-xl bg-joordak px-4 py-2 text-sm font-bold text-white sm:flex-1">
                            اعمال فیلتر
                        </button>
                        <button type="button" onClick={clearFilters} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 sm:flex-1">
                            پاک کردن فیلترها
                        </button>
                    </div>
                </form>
            </Modal>
        </AdminLayout>
    );
}

type InvoiceFilters = InvoiceIndexProps['filters'];

function compactFilters(filters: InvoiceFilters): Record<string, string> {
    return Object.fromEntries(
        Object.entries(filters).filter(([, value]) => Boolean(value))
    ) as Record<string, string>;
}

function DateFilterInput({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
}) {
    const isEmpty = !value;

    return (
        <label className="relative block">
            {isEmpty && (
                <span className="pointer-events-none absolute inset-y-0 end-3 z-10 flex items-center text-sm text-slate-400">
                    {label}
                </span>
            )}
            <input
                type="date"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                aria-label={label}
                className={[
                    'w-full rounded-xl border-slate-200 text-sm',
                    isEmpty && 'text-transparent [&::-webkit-datetime-edit]:text-transparent [&::-webkit-datetime-edit-fields-wrapper]:text-transparent',
                    isEmpty && 'focus:text-inherit focus:[&::-webkit-datetime-edit]:text-inherit focus:[&::-webkit-datetime-edit-fields-wrapper]:text-inherit',
                ].filter(Boolean).join(' ')}
            />
        </label>
    );
}
