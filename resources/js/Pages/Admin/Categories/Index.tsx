import AdminCard from '@/Components/Admin/AdminCard';
import AdminDangerAction from '@/Components/Admin/AdminDangerAction';
import AdminEmptyState from '@/Components/Admin/AdminEmptyState';
import AdminPageHeader from '@/Components/Admin/AdminPageHeader';
import AdminPagination from '@/Components/Admin/AdminPagination';
import AdminTable from '@/Components/Admin/AdminTable';
import AdminLayout from '@/Layouts/AdminLayout';
import { formatDateFa } from '@/lib/format';
import type { AdminCategory, Paginated } from '@/types/admin';
import { Link, router } from '@inertiajs/react';
import { FormEvent, useState } from 'react';

interface CategoryIndexProps {
    categories: Paginated<AdminCategory>;
    filters: {
        search?: string;
    };
}

export default function CategoryIndex({ categories, filters }: CategoryIndexProps) {
    const [search, setSearch] = useState(filters.search ?? '');

    function submit(event: FormEvent) {
        event.preventDefault();
        router.get(route('admin.categories.index'), { search }, { preserveState: true, preserveScroll: true });
    }

    return (
        <AdminLayout title="دسته‌بندی‌ها">
            <AdminPageHeader title="دسته‌بندی‌ها" description="مدیریت دسته‌بندی محصولات." actionHref={route('admin.categories.create')} actionLabel="دسته‌بندی جدید" />
            <AdminCard className="mb-5">
                <form onSubmit={submit} className="flex flex-col gap-3 md:flex-row">
                    <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="جستجوی نام یا نامک" className="flex-1 rounded-xl border-slate-200 text-sm" />
                    <button type="submit" className="rounded-xl bg-joordak px-4 py-2 text-sm font-bold text-white">جستجو</button>
                </form>
            </AdminCard>
            <AdminCard>
                {categories.data.length === 0 ? (
                    <AdminEmptyState message="دسته‌بندی‌ای پیدا نشد." />
                ) : (
                    <>
                        <AdminTable headers={['نام', 'نامک', 'محصولات', 'تاریخ', '']}>
                            {categories.data.map((category) => (
                                <tr key={category.id}>
                                    <td className="px-4 py-3 font-bold">{category.name}</td>
                                    <td className="px-4 py-3 text-slate-500">{category.slug}</td>
                                    <td className="whitespace-nowrap px-4 py-3">{category.products_count ?? 0}</td>
                                    <td className="whitespace-nowrap px-4 py-3">{formatDateFa(category.created_at)}</td>
                                    <td className="whitespace-nowrap px-4 py-3">
                                        <div className="flex gap-2">
                                            <Link href={route('admin.categories.edit', category.id)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50">ویرایش</Link>
                                            <AdminDangerAction href={route('admin.categories.destroy', category.id)} label="حذف" />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </AdminTable>
                        <AdminPagination items={categories} />
                    </>
                )}
            </AdminCard>
        </AdminLayout>
    );
}
