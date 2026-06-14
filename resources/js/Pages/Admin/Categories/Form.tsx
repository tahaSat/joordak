import AdminCard from '@/Components/Admin/AdminCard';
import AdminFormField from '@/Components/Admin/AdminFormField';
import ImageCropperModal, { type CropResult } from '@/Components/Admin/ImageCropperModal';
import AdminPageHeader from '@/Components/Admin/AdminPageHeader';
import AdminLayout from '@/Layouts/AdminLayout';
import type { AdminCategory } from '@/types/admin';
import { Link, useForm } from '@inertiajs/react';
import { ChangeEvent, FormEvent, useState } from 'react';

interface CategoryFormProps {
    category: AdminCategory | null;
}

interface CategoryFormData {
    name: string;
    slug: string;
    description: string;
    image_url: string;
    [key: string]: string;
}

interface UploadedImage {
    path: string;
    preview_url: string | null;
}

interface QueuedUpload {
    id: string;
    status: string;
}

interface UploadStatus {
    status: 'queued' | 'processing' | 'completed' | 'failed';
    file?: UploadedImage;
    message?: string;
}

const categoryImageRequestTimeout = 30_000;
const categoryImagePollInterval = 1_000;
const categoryImageMaxPolls = 30;
const categoryImageUploadWidth = 576;
const categoryImageUploadHeight = 384;

export default function CategoryForm({ category }: CategoryFormProps) {
    const isEditing = Boolean(category);
    const form = useForm<CategoryFormData>({
        name: category?.name ?? '',
        slug: category?.slug ?? '',
        description: category?.description ?? '',
        image_url: category?.image_url ?? '',
    });
    const [coverImage, setCoverImage] = useState<UploadedImage | null>(
        category?.image_url ? {
            path: category.image_url,
            preview_url: category.image_preview_url,
        } : null,
    );
    const [isUploading, setIsUploading] = useState(false);
    const [imageUploadError, setImageUploadError] = useState<string | null>(null);
    const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null);

    function submit(event: FormEvent) {
        event.preventDefault();

        if (category) {
            form.put(route('admin.categories.update', category.id), { preserveScroll: true });
            return;
        }

        form.post(route('admin.categories.store'));
    }

    function generateSlug() {
        if (!form.data.name) {
            return;
        }

        window.axios.post<{ slug: string }>(route('admin.slugs.store'), { title: form.data.name })
            .then((response) => form.setData('slug', response.data.slug));
    }

    async function enqueueImage(file: File) {
        const uploadForm = new FormData();
        uploadForm.append('image', file);

        return window.axios.post<{ upload: QueuedUpload }>(route('admin.categories.image.store'), uploadForm, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            timeout: categoryImageRequestTimeout,
        });
    }

    async function pollQueuedUpload(uploadId: string): Promise<UploadedImage> {
        for (let attempt = 0; attempt < categoryImageMaxPolls; attempt += 1) {
            const response = await window.axios.get<UploadStatus>(route('admin.categories.image.show', uploadId), {
                timeout: categoryImageRequestTimeout,
            });

            if (response.data.status === 'completed' && response.data.file) {
                return response.data.file;
            }

            if (response.data.status === 'failed') {
                throw new Error(response.data.message ?? 'Category image upload failed.');
            }

            await new Promise((resolve) => window.setTimeout(resolve, categoryImagePollInterval));
        }

        throw new Error('Category image upload timed out.');
    }

    function handleCoverChange(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        event.target.value = '';

        if (!file) {
            return;
        }

        setImageUploadError(null);
        setPendingCoverFile(file);
    }

    async function uploadCroppedCover({ file, previewUrl }: CropResult) {
        setIsUploading(true);
        setImageUploadError(null);
        try {
            const response = await enqueueImage(file);
            const uploaded = await pollQueuedUpload(response.data.upload.id);

            setCoverImage(uploaded);
            form.setData('image_url', uploaded.path);
            setPendingCoverFile(null);
        } catch (error) {
            setImageUploadError(error instanceof Error ? error.message : 'آپلود تصویر ناموفق بود.');
        } finally {
            URL.revokeObjectURL(previewUrl);
            setIsUploading(false);
        }
    }

    function removeCoverImage() {
        if (!coverImage) {
            return;
        }

        setCoverImage(null);
        form.setData('image_url', '');
        window.axios.delete(route('admin.categories.image.destroy'), {
            data: { path: coverImage.path },
            timeout: categoryImageRequestTimeout,
        });
    }

    return (
        <AdminLayout title={isEditing ? 'ویرایش دسته‌بندی' : 'دسته‌بندی جدید'}>
            <AdminPageHeader title={isEditing ? 'ویرایش دسته‌بندی' : 'دسته‌بندی جدید'} description="نام، نامک، توضیحات و تصویر دسته‌بندی." />
            <Link href={route('admin.categories.index')} className="mb-5 inline-block text-sm font-bold text-joordak-coral">بازگشت</Link>

            <AdminCard>
                <form onSubmit={submit} className="grid gap-5 md:grid-cols-2">
                    <AdminFormField label="نام" error={form.errors.name}>
                        <input value={form.data.name} onChange={(event) => form.setData('name', event.target.value)} className="w-full rounded-xl border-slate-200 text-sm" />
                    </AdminFormField>
                    <AdminFormField label="نامک" error={form.errors.slug}>
                        <div className="flex gap-2">
                            <input value={form.data.slug} onChange={(event) => form.setData('slug', event.target.value)} className="w-full rounded-xl border-slate-200 text-sm" />
                            <button type="button" onClick={generateSlug} className="rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-600">ساخت</button>
                        </div>
                    </AdminFormField>
                    <AdminFormField label="توضیحات" error={form.errors.description}>
                        <textarea value={form.data.description} onChange={(event) => form.setData('description', event.target.value)} rows={6} className="w-full rounded-xl border-slate-200 text-sm" />
                    </AdminFormField>
                    {imageUploadError && (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 md:col-span-2">
                            {imageUploadError}
                        </div>
                    )}
                    <AdminFormField label="تصویر دسته‌بندی" error={form.errors.image_url}>
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
                            {coverImage?.preview_url ? (
                                <div className="mb-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
                                    <img src={coverImage.preview_url} alt={form.data.name || 'تصویر دسته‌بندی'} className="h-56 w-full object-cover" />
                                    <div className="flex items-center justify-between gap-3 p-3">
                                        <span className="truncate text-xs font-semibold text-slate-500">{coverImage.path}</span>
                                        <button type="button" onClick={removeCoverImage} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100">
                                            حذف تصویر
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <p className="mb-4 text-sm font-semibold text-slate-500">تصویر دسته‌بندی هنوز آپلود نشده است.</p>
                            )}
                            <p className="mb-3 text-xs font-semibold text-slate-500">
                                تصویر قبل از آپلود با نسبت ۳:۲ و اندازه ۵۷۶×۳۸۴ برش داده می‌شود.
                            </p>
                            <label className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-joordak px-4 py-2 text-sm font-bold text-white transition hover:bg-[#17475c]">
                                {isUploading ? 'در حال آپلود...' : 'آپلود تصویر'}
                                <input type="file" accept="image/*" onChange={handleCoverChange} disabled={isUploading} className="hidden" />
                            </label>
                        </div>
                    </AdminFormField>
                    <div className="md:col-span-2">
                        <button disabled={form.processing} className="rounded-xl bg-joordak px-5 py-2 text-sm font-bold text-white disabled:opacity-60">
                            {isEditing ? 'ذخیره تغییرات' : 'ساخت دسته‌بندی'}
                        </button>
                    </div>
                </form>
            </AdminCard>
            <ImageCropperModal
                file={pendingCoverFile}
                title="برش تصویر دسته‌بندی"
                description="کادر تصویر را تنظیم کنید؛ بعد از تایید، تصویر آپلود می‌شود."
                outputWidth={categoryImageUploadWidth}
                outputHeight={categoryImageUploadHeight}
                fallbackName="category-image"
                isProcessing={isUploading}
                onCancel={() => setPendingCoverFile(null)}
                onConfirm={uploadCroppedCover}
            />
        </AdminLayout>
    );
}
