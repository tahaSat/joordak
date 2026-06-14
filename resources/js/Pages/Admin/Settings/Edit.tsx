import AdminCard from '@/Components/Admin/AdminCard';
import AdminFormField from '@/Components/Admin/AdminFormField';
import ImageCropperModal, { type CropResult } from '@/Components/Admin/ImageCropperModal';
import AdminPageHeader from '@/Components/Admin/AdminPageHeader';
import AdminLayout from '@/Layouts/AdminLayout';
import { useForm } from '@inertiajs/react';
import { ChangeEvent, FormEvent, useState } from 'react';

interface SettingsEditProps {
    banner: {
        path: string | null;
        preview_url: string | null;
    };
    settings: {
        post_cost_tehran: string | null;
        post_cost_others: string | null;
        hero_title: string | null;
        hero_subtitle: string | null;
    };
}

interface SettingsFormData {
    path: string;
    post_cost_tehran: string;
    post_cost_others: string;
    hero_title: string;
    hero_subtitle: string;
    [key: string]: string;
}

interface UploadedBanner {
    path: string;
    preview_url: string | null;
}

interface QueuedUpload {
    id: string;
    status: string;
}

interface UploadStatus {
    status: 'queued' | 'processing' | 'completed' | 'failed';
    file?: UploadedBanner;
    message?: string;
}

const bannerRequestTimeout = 30_000;
const bannerPollInterval = 1_000;
const bannerMaxPolls = 30;
const bannerUploadWidth = 1480;
const bannerUploadHeight = 500;

function normalizeDigits(value: string): string {
    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
    const arabicDigits = '٠١٢٣٤٥٦٧٨٩';

    return value
        .replace(/[۰-۹]/g, (digit) => String(persianDigits.indexOf(digit)))
        .replace(/[٠-٩]/g, (digit) => String(arabicDigits.indexOf(digit)))
        .replace(/\D/g, '');
}

function formatNumberInput(value: string): string {
    const digits = normalizeDigits(value);

    return digits ? Number(digits).toLocaleString('en-US') : '';
}

export default function SettingsEdit({ banner, settings }: SettingsEditProps) {
    const form = useForm<SettingsFormData>({
        path: banner.path ?? '',
        post_cost_tehran: normalizeDigits(settings.post_cost_tehran ?? '0') || '0',
        post_cost_others: normalizeDigits(settings.post_cost_others ?? '0') || '0',
        hero_title: settings.hero_title ?? 'به جردک خوش آمدید',
        hero_subtitle: settings.hero_subtitle ?? 'فروشگاه آنلاین مد و پوشاک',
    });
    const [currentBanner, setCurrentBanner] = useState<UploadedBanner | null>(
        banner.path ? {
            path: banner.path,
            preview_url: banner.preview_url,
        } : null,
    );
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [pendingBannerFile, setPendingBannerFile] = useState<File | null>(null);

    function submit(event: FormEvent) {
        event.preventDefault();
        form.post(route('admin.settings.update'), {
            preserveScroll: true,
        });
    }

    async function enqueueBanner(file: File) {
        const uploadForm = new FormData();
        uploadForm.append('banner', file);

        return window.axios.post<{ upload: QueuedUpload }>(route('admin.settings.image.store'), uploadForm, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            timeout: bannerRequestTimeout,
        });
    }

    async function pollQueuedUpload(uploadId: string): Promise<UploadedBanner> {
        for (let attempt = 0; attempt < bannerMaxPolls; attempt += 1) {
            const response = await window.axios.get<UploadStatus>(route('admin.settings.image.show', uploadId), {
                timeout: bannerRequestTimeout,
            });

            if (response.data.status === 'completed' && response.data.file) {
                return response.data.file;
            }

            if (response.data.status === 'failed') {
                throw new Error(response.data.message ?? 'Banner upload failed.');
            }

            await new Promise((resolve) => window.setTimeout(resolve, bannerPollInterval));
        }

        throw new Error('Banner upload timed out.');
    }

    function handleBannerChange(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        event.target.value = '';

        if (!file) {
            return;
        }

        setUploadError(null);
        setPendingBannerFile(file);
    }

    async function uploadCroppedBanner({ file, previewUrl }: CropResult) {
        setIsUploading(true);
        setUploadError(null);
        try {
            const response = await enqueueBanner(file);
            const uploaded = await pollQueuedUpload(response.data.upload.id);

            setCurrentBanner(uploaded);
            form.setData('path', uploaded.path);
            setPendingBannerFile(null);
        } catch (error) {
            setUploadError(error instanceof Error ? error.message : 'آپلود بنر ناموفق بود.');
        } finally {
            URL.revokeObjectURL(previewUrl);
            setIsUploading(false);
        }
    }

    function removeBanner() {
        if (!currentBanner) {
            return;
        }

        setCurrentBanner(null);
        form.setData('path', '');
        window.axios.delete(route('admin.settings.image.destroy'), {
            data: { path: currentBanner.path },
            timeout: bannerRequestTimeout,
        });
    }

    return (
        <AdminLayout title="تنظیمات">
            <AdminPageHeader title="تنظیمات" description="بنر صفحه اصلی و هزینه‌های ارسال فروشگاه را مدیریت کنید." />
            <AdminCard>
                <form onSubmit={submit} className="space-y-6">
                    {uploadError && (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                            {uploadError}
                        </div>
                    )}

                    <section className="space-y-4">
                        <h2 className="text-lg font-black text-slate-900">متن هرو صفحه اصلی</h2>
                        <div className="grid gap-4 md:grid-cols-2">
                            <AdminFormField label="عنوان کاور" error={form.errors.hero_title}>
                                <input
                                    value={form.data.hero_title}
                                    onChange={(event) => form.setData('hero_title', event.target.value)}
                                    className="w-full rounded-xl border-slate-200 text-sm"
                                />
                            </AdminFormField>
                            <AdminFormField label="زیرعنوان کاور" error={form.errors.hero_subtitle}>
                                <input
                                    value={form.data.hero_subtitle}
                                    onChange={(event) => form.setData('hero_subtitle', event.target.value)}
                                    className="w-full rounded-xl border-slate-200 text-sm"
                                />
                            </AdminFormField>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-lg font-black text-slate-900">هزینه ارسال</h2>
                        <div className="grid gap-4 md:grid-cols-2">
                            <AdminFormField label="هزینه ی ارسال به تهران" error={form.errors.post_cost_tehran}>
                                <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:border-joordak focus-within:ring-1 focus-within:ring-[joordak-coral]">
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        dir="ltr"
                                        value={formatNumberInput(form.data.post_cost_tehran)}
                                        onChange={(event) => form.setData('post_cost_tehran', normalizeDigits(event.target.value))}
                                        className="w-full border-0 text-left text-sm focus:ring-0"
                                    />
                                    <span className="flex shrink-0 items-center border-r border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-500">
                                        ریال
                                    </span>
                                </div>
                            </AdminFormField>
                            <AdminFormField label="هزینه ی ارسال به استان های دیگر" error={form.errors.post_cost_others}>
                                <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:border-joordak focus-within:ring-1 focus-within:ring-[joordak-coral]">
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        dir="ltr"
                                        value={formatNumberInput(form.data.post_cost_others)}
                                        onChange={(event) => form.setData('post_cost_others', normalizeDigits(event.target.value))}
                                        className="w-full border-0 text-left text-sm focus:ring-0"
                                    />
                                    <span className="flex shrink-0 items-center border-r border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-500">
                                        ریال
                                    </span>
                                </div>
                            </AdminFormField>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-lg font-black text-slate-900">بنر صفحه اصلی</h2>
                        <AdminFormField label="تصویر بنر" error={form.errors.path}>
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
                                {currentBanner?.preview_url ? (
                                    <div className="mb-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
                                        <img src={currentBanner.preview_url} alt="بنر صفحه اصلی" className="aspect-[74/25] w-full object-cover" />
                                        <div className="flex items-center justify-between gap-3 p-3">
                                            <span className="truncate text-xs font-semibold text-slate-500">{currentBanner.path}</span>
                                            <button type="button" onClick={removeBanner} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100">
                                                حذف تصویر
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="mb-4 rounded-xl bg-white p-4 text-sm font-semibold text-slate-500">هنوز بنری ثبت نشده است.</p>
                                )}
                                <p className="mb-3 text-xs font-semibold text-slate-500">
                                    تصویر قبل از آپلود با نسبت بنر صفحه اصلی و اندازه ۱۴۸۰×۵۰۰ برش داده می‌شود.
                                </p>
                                <label className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-joordak px-4 py-2 text-sm font-bold text-white transition hover:bg-[#17475c]">
                                    {isUploading ? 'در حال آپلود...' : 'آپلود تصویر بنر'}
                                    <input type="file" accept="image/*" onChange={handleBannerChange} disabled={isUploading} className="hidden" />
                                </label>
                            </div>
                        </AdminFormField>
                    </section>

                    <button disabled={form.processing} className="rounded-xl bg-joordak px-5 py-2 text-sm font-bold text-white disabled:opacity-60">
                        ذخیره تنظیمات
                    </button>
                </form>
            </AdminCard>
            <ImageCropperModal
                file={pendingBannerFile}
                title="برش تصویر بنر"
                description="کادر بنر را تنظیم کنید؛ بعد از تایید، تصویر آپلود می‌شود."
                outputWidth={bannerUploadWidth}
                outputHeight={bannerUploadHeight}
                fallbackName="home-banner"
                isProcessing={isUploading}
                onCancel={() => setPendingBannerFile(null)}
                onConfirm={uploadCroppedBanner}
            />
        </AdminLayout>
    );
}
