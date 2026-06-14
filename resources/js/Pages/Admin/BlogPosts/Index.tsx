import AdminCard from '@/Components/Admin/AdminCard';
import AdminDangerAction from '@/Components/Admin/AdminDangerAction';
import AdminEmptyState from '@/Components/Admin/AdminEmptyState';
import AdminPageHeader from '@/Components/Admin/AdminPageHeader';
import AdminPagination from '@/Components/Admin/AdminPagination';
import AdminTable from '@/Components/Admin/AdminTable';
import AdminLayout from '@/Layouts/AdminLayout';
import { formatDateFa } from '@/lib/format';
import type { AdminBlogPost, Paginated } from '@/types/admin';
import { Link, router } from '@inertiajs/react';
import { FormEvent, useState } from 'react';

interface BlogPostIndexProps {
    posts: Paginated<AdminBlogPost>;
    filters: {
        search?: string;
    };
}

export default function BlogPostIndex({ posts, filters }: BlogPostIndexProps) {
    const [search, setSearch] = useState(filters.search ?? '');

    function submit(event: FormEvent) {
        event.preventDefault();
        router.get(route('admin.blog-posts.index'), { search }, { preserveState: true, preserveScroll: true });
    }

    return (
        <AdminLayout title="وبلاگ">
            <AdminPageHeader title="وبلاگ" description="مدیریت مطالب و وضعیت انتشار." actionHref={route('admin.blog-posts.create')} actionLabel="مطلب جدید" />
            <AdminCard className="mb-5">
                <form onSubmit={submit} className="flex flex-col gap-3 md:flex-row">
                    <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="جستجوی عنوان، نامک یا خلاصه" className="flex-1 rounded-xl border-slate-200 text-sm" />
                    <button type="submit" className="rounded-xl bg-joordak px-4 py-2 text-sm font-bold text-white">جستجو</button>
                </form>
            </AdminCard>
            <AdminCard>
                {posts.data.length === 0 ? (
                    <AdminEmptyState message="مطلبی پیدا نشد." />
                ) : (
                    <>
                        <AdminTable headers={['تصویر', 'عنوان', 'نویسنده', 'انتشار', 'تاریخ انتشار', '']}>
                            {posts.data.map((post) => (
                                <tr key={post.id}>
                                    <td className="px-4 py-3">
                                        {post.image_preview_url ? <img src={post.image_preview_url} alt={post.title} className="h-12 w-16 rounded-lg object-cover" /> : <div className="h-12 w-16 rounded-lg bg-slate-100" />}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-bold text-slate-800">{post.title}</div>
                                        <div className="text-xs text-slate-500">{post.slug}</div>
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3">{post.author_name ?? '—'}</td>
                                    <td className="whitespace-nowrap px-4 py-3">{post.is_published ? 'منتشر شده' : 'پیش‌نویس'}</td>
                                    <td className="whitespace-nowrap px-4 py-3">{formatDateFa(post.published_at)}</td>
                                    <td className="whitespace-nowrap px-4 py-3">
                                        <div className="flex gap-2">
                                            <Link href={route('admin.blog-posts.edit', post.id)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50">ویرایش</Link>
                                            <AdminDangerAction href={route('admin.blog-posts.destroy', post.id)} label="حذف" />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </AdminTable>
                        <AdminPagination items={posts} />
                    </>
                )}
            </AdminCard>
        </AdminLayout>
    );
}
