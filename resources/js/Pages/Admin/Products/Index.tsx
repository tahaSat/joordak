import AdminCard from '@/Components/Admin/AdminCard';
import AdminDangerAction from '@/Components/Admin/AdminDangerAction';
import AdminEmptyState from '@/Components/Admin/AdminEmptyState';
import AdminPageHeader from '@/Components/Admin/AdminPageHeader';
import AdminPagination from '@/Components/Admin/AdminPagination';
import AdminTable from '@/Components/Admin/AdminTable';
import AdminLayout from '@/Layouts/AdminLayout';
import { formatDateFa, formatPrice } from '@/lib/format';
import type { AdminProduct, Paginated } from '@/types/admin';
import { Link, router } from '@inertiajs/react';
import { FormEvent, useState } from 'react';

interface ProductIndexProps {
    products: Paginated<AdminProduct>;
    filters: {
        search?: string;
    };
}

export default function ProductIndex({ products, filters }: ProductIndexProps) {
    const [search, setSearch] = useState(filters.search ?? '');

    function submit(event: FormEvent) {
        event.preventDefault();
        router.get(route('admin.products.index'), { search }, { preserveState: true, preserveScroll: true });
    }

    return (
        <AdminLayout title="محصولات">
            <AdminPageHeader title="محصولات" description="مدیریت موجودی، قیمت و تصاویر محصولات." actionHref={route('admin.products.create')} actionLabel="محصول جدید" />

            <AdminCard className="mb-5">
                <form onSubmit={submit} className="flex flex-col gap-3 md:flex-row">
                    <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="جستجوی عنوان، نامک، خلاصه یا دسته" className="flex-1 rounded-xl border-slate-200 text-sm" />
                    <button type="submit" className="rounded-xl bg-joordak px-4 py-2 text-sm font-bold text-white">جستجو</button>
                </form>
            </AdminCard>

            <AdminCard>
                {products.data.length === 0 ? (
                    <AdminEmptyState message="محصولی پیدا نشد." />
                ) : (
                    <>
                        <AdminTable headers={['تصویر', 'عنوان', 'دسته', 'زیرمحصول‌ها', 'قیمت اول', 'موجودی اول', 'سایز اول', 'رنگ اول', 'فعال', 'تاریخ', '']}>
                            {products.data.map((product) => {
                                const firstSubProduct = product.subproducts[0];

                                return (
                                <tr key={product.id}>
                                    <td className="px-4 py-3">
                                        {product.image_preview_url ? (
                                            <img src={product.image_preview_url} alt={product.title} className="h-12 w-16 rounded-lg object-cover" />
                                        ) : (
                                            <div className="h-12 w-16 rounded-lg bg-slate-100" />
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-bold text-slate-800">{product.title}</div>
                                        <div className="text-xs text-slate-500">{product.slug}</div>
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3">{product.category_name ?? '—'}</td>
                                    <td className="whitespace-nowrap px-4 py-3">{product.subproducts.length}</td>
                                    <td className="whitespace-nowrap px-4 py-3 font-bold">{firstSubProduct ? formatPrice(firstSubProduct.price) : '—'}</td>
                                    <td className="whitespace-nowrap px-4 py-3">{firstSubProduct?.stock ?? '—'}</td>
                                    <td className="whitespace-nowrap px-4 py-3">{firstSubProduct?.size ?? '—'}</td>
                                    <td className="whitespace-nowrap px-4 py-3">
                                        {firstSubProduct?.color_name || firstSubProduct?.color_hex ? (
                                            <span className="inline-flex items-center gap-2">
                                                {firstSubProduct.color_hex && <span className="h-4 w-4 rounded border border-slate-200" style={{ backgroundColor: firstSubProduct.color_hex }} />}
                                                {firstSubProduct.color_name ?? firstSubProduct.color_hex}
                                            </span>
                                        ) : '—'}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3">{product.is_active ? 'بله' : 'خیر'}</td>
                                    <td className="whitespace-nowrap px-4 py-3">{formatDateFa(product.created_at)}</td>
                                    <td className="whitespace-nowrap px-4 py-3">
                                        <div className="flex gap-2">
                                            <Link href={route('admin.products.edit', product.id)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
                                                ویرایش
                                            </Link>
                                            <AdminDangerAction href={route('admin.products.destroy', product.id)} label="حذف" />
                                        </div>
                                    </td>
                                </tr>
                                );
                            })}
                        </AdminTable>
                        <AdminPagination items={products} />
                    </>
                )}
            </AdminCard>
        </AdminLayout>
    );
}
