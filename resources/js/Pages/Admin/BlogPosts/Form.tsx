import AdminCard from '@/Components/Admin/AdminCard';
import AdminFormField from '@/Components/Admin/AdminFormField';
import AdminPageHeader from '@/Components/Admin/AdminPageHeader';
import AdminLayout from '@/Layouts/AdminLayout';
import type { AdminBlogPost, Option } from '@/types/admin';
import { Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

interface BlogPostFormProps {
    post: AdminBlogPost | null;
    authors: Option[];
}

interface BlogPostFormData {
    user_id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    is_published: boolean;
    published_at: string;
    image: File | null;
    [key: string]: string | boolean | File | null;
}

export default function BlogPostForm({ post, authors }: BlogPostFormProps) {
    const isEditing = Boolean(post);
    const form = useForm<BlogPostFormData>({
        user_id: post?.user_id ? String(post.user_id) : '',
        title: post?.title ?? '',
        slug: post?.slug ?? '',
        excerpt: post?.excerpt ?? '',
        content: post?.content ?? '',
        is_published: post?.is_published ?? false,
        published_at: post?.published_at ?? '',
        image: null,
    });

    function submit(event: FormEvent) {
        event.preventDefault();

        if (post) {
            form.transform((data) => ({ ...data, _method: 'put' }));
            form.post(route('admin.blog-posts.update', post.id), { forceFormData: true, preserveScroll: true });
            return;
        }

        form.post(route('admin.blog-posts.store'), { forceFormData: true });
    }

    function generateSlug() {
        if (!form.data.title) {
            return;
        }

        window.axios.post<{ slug: string }>(route('admin.slugs.store'), { title: form.data.title })
            .then((response) => form.setData('slug', response.data.slug));
    }

    return (
        <AdminLayout title={isEditing ? 'ویرایش مطلب' : 'مطلب جدید'}>
            <AdminPageHeader title={isEditing ? 'ویرایش مطلب' : 'مطلب جدید'} description="محتوا، تصویر و زمان انتشار مطلب." />
            <Link href={route('admin.blog-posts.index')} className="mb-5 inline-block text-sm font-bold text-joordak-coral">بازگشت</Link>

            <AdminCard>
                <form onSubmit={submit} className="grid gap-5 md:grid-cols-2">
                    <AdminFormField label="نویسنده" error={form.errors.user_id}>
                        <select value={form.data.user_id} onChange={(event) => form.setData('user_id', event.target.value)} className="w-full rounded-xl border-slate-200 text-sm">
                            <option value="">بدون نویسنده</option>
                            {authors.map((author) => <option key={author.id} value={author.id}>{author.name}</option>)}
                        </select>
                    </AdminFormField>
                    <AdminFormField label="عنوان" error={form.errors.title}>
                        <input value={form.data.title} onChange={(event) => form.setData('title', event.target.value)} className="w-full rounded-xl border-slate-200 text-sm" />
                    </AdminFormField>
                    <AdminFormField label="نامک" error={form.errors.slug}>
                        <div className="flex gap-2">
                            <input value={form.data.slug} onChange={(event) => form.setData('slug', event.target.value)} className="w-full rounded-xl border-slate-200 text-sm" />
                            <button type="button" onClick={generateSlug} className="rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-600">ساخت</button>
                        </div>
                    </AdminFormField>
                    <AdminFormField label="خلاصه" error={form.errors.excerpt}>
                        <input value={form.data.excerpt} onChange={(event) => form.setData('excerpt', event.target.value)} className="w-full rounded-xl border-slate-200 text-sm" />
                    </AdminFormField>
                    <AdminFormField label="محتوا" error={form.errors.content}>
                        <textarea value={form.data.content} onChange={(event) => form.setData('content', event.target.value)} rows={10} className="w-full rounded-xl border-slate-200 text-sm" />
                    </AdminFormField>
                    <div className="space-y-5">
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                            <input type="checkbox" checked={form.data.is_published} onChange={(event) => form.setData('is_published', event.target.checked)} className="rounded border-slate-300 text-joordak-coral" />
                            منتشر شود
                        </label>
                        <AdminFormField label="تاریخ انتشار" error={form.errors.published_at}>
                            <input type="datetime-local" value={form.data.published_at} onChange={(event) => form.setData('published_at', event.target.value)} className="w-full rounded-xl border-slate-200 text-sm" />
                        </AdminFormField>
                        <AdminFormField label="تصویر" error={form.errors.image}>
                            {post?.image_preview_url && <img src={post.image_preview_url} alt={post.title} className="mb-3 h-28 w-40 rounded-xl object-cover" />}
                            <input type="file" accept="image/*" onChange={(event) => form.setData('image', event.target.files?.[0] ?? null)} className="w-full text-sm" />
                        </AdminFormField>
                    </div>
                    <div className="md:col-span-2">
                        <button disabled={form.processing} className="rounded-xl bg-joordak px-5 py-2 text-sm font-bold text-white disabled:opacity-60">
                            {isEditing ? 'ذخیره تغییرات' : 'ساخت مطلب'}
                        </button>
                    </div>
                </form>
            </AdminCard>
        </AdminLayout>
    );
}
