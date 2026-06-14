import AdminCard from '@/Components/Admin/AdminCard';
import AdminDangerAction from '@/Components/Admin/AdminDangerAction';
import AdminEmptyState from '@/Components/Admin/AdminEmptyState';
import AdminPageHeader from '@/Components/Admin/AdminPageHeader';
import AdminPagination from '@/Components/Admin/AdminPagination';
import AdminTable from '@/Components/Admin/AdminTable';
import AdminLayout from '@/Layouts/AdminLayout';
import { formatDateFa, formatPrice } from '@/lib/format';
import type { AdminDiscountCode, Paginated } from '@/types/admin';
import { Link, router } from '@inertiajs/react';
import { FormEvent, useState } from 'react';

interface DiscountCodeIndexProps {
    discountCodes: Paginated<AdminDiscountCode>;
    filters: {
        search?: string;
    };
    typeLabels: Record<string, string>;
}

function describeValue(discountCode: AdminDiscountCode): string {
    if (discountCode.type === 'percent') {
        const cap = discountCode.max_discount ? ` (سقف ${formatPrice(discountCode.max_discount)})` : '';
        return `${discountCode.value}٪${cap}`;
    }

    return formatPrice(discountCode.value);
}

export default function DiscountCodeIndex({ discountCodes, filters, typeLabels }: DiscountCodeIndexProps) {
    const [search, setSearch] = useState(filters.search ?? '');

    function submit(event: FormEvent) {
        event.preventDefault();
        router.get(route('admin.discount-codes.index'), { search }, { preserveState: true, preserveScroll: true });
    }

    return (
        <AdminLayout title="کدهای تخفیف">
            <AdminPageHeader title="کدهای تخفیف" description="مدیریت کدهای تخفیف فاکتور." actionHref={route('admin.discount-codes.create')} actionLabel="کد تخفیف جدید" />
            <AdminCard className="mb-5">
                <form onSubmit={submit} className="flex flex-col gap-3 md:flex-row">
                    <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="جستجوی کد" className="flex-1 rounded-xl border-slate-200 text-sm" dir="ltr" />
                    <button type="submit" className="rounded-xl bg-joordak px-4 py-2 text-sm font-bold text-white">جستجو</button>
                </form>
            </AdminCard>
            <AdminCard>
                {discountCodes.data.length === 0 ? (
                    <AdminEmptyState message="کد تخفیفی پیدا نشد." />
                ) : (
                    <>
                        <AdminTable headers={['کد', 'نوع', 'مقدار', 'استفاده', 'وضعیت', 'تاریخ', '']}>
                            {discountCodes.data.map((discountCode) => (
                                <tr key={discountCode.id}>
                                    <td className="px-4 py-3 font-bold" dir="ltr">{discountCode.code}</td>
                                    <td className="px-4 py-3 text-slate-500">{typeLabels[discountCode.type] ?? discountCode.type}</td>
                                    <td className="whitespace-nowrap px-4 py-3">{describeValue(discountCode)}</td>
                                    <td className="whitespace-nowrap px-4 py-3">
                                        {discountCode.used_count}
                                        {discountCode.usage_limit ? ` / ${discountCode.usage_limit}` : ''}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3">
                                        <span className={`rounded-full px-2 py-1 text-xs font-bold ${discountCode.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                                            {discountCode.is_active ? 'فعال' : 'غیرفعال'}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3">{formatDateFa(discountCode.created_at)}</td>
                                    <td className="whitespace-nowrap px-4 py-3">
                                        <div className="flex gap-2">
                                            <Link href={route('admin.discount-codes.edit', discountCode.id)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50">ویرایش</Link>
                                            <AdminDangerAction href={route('admin.discount-codes.destroy', discountCode.id)} label="حذف" />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </AdminTable>
                        <AdminPagination items={discountCodes} />
                    </>
                )}
            </AdminCard>
        </AdminLayout>
    );
}
