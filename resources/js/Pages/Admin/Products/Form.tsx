import AdminCard from '@/Components/Admin/AdminCard';
import AdminFormField from '@/Components/Admin/AdminFormField';
import ImageCropperModal, { type CropResult } from '@/Components/Admin/ImageCropperModal';
import {
    PRODUCT_IMAGE_CROP_HINT,
    PRODUCT_IMAGE_GALLERY_CROP_HINT,
    PRODUCT_IMAGE_UPLOAD_HEIGHT,
    PRODUCT_IMAGE_UPLOAD_WIDTH,
} from '@/constants/productImage';
import AdminPageHeader from '@/Components/Admin/AdminPageHeader';
import AdminLayout from '@/Layouts/AdminLayout';
import type { AdminProduct, AdminSubProduct, Option } from '@/types/admin';
import { Link, useForm } from '@inertiajs/react';
import { ChangeEvent, FormEvent, useState } from 'react';

interface ProductFormProps {
    product: AdminProduct | null;
    categories: Option[];
}

interface ProductFormData {
    category_id: string;
    title: string;
    slug: string;
    excerpt: string;
    description: string;
    is_active: boolean;
    image_url: string;
    subproducts: SubProductFormData[];
    [key: string]: string | boolean | SubProductFormData[];
}

type DiscountTypeValue = '' | 'percent' | 'amount';

interface SubProductFormData {
    id?: number;
    price: string;
    stock: string;
    size: string;
    color_name: string;
    color_hex: string;
    discount_type: DiscountTypeValue;
    discount_value: string;
    discount_starts_at: string;
    discount_ends_at: string;
    discount_usage_limit: string;
    photo_urls: string[];
}

interface UploadedImage {
    path: string;
    preview_url: string | null;
}

interface SubProductImageState extends SubProductFormData {
    galleryImages: UploadedImage[];
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

const productImageRequestTimeout = 30_000;
const productImagePollInterval = 1_000;
const productImageMaxPolls = 30;
const maxProductPrice = 999_999_999_999_999;
function toLocalInput(value: string | null): string {
    if (!value) {
        return '';
    }

    const date = new Date(value);
    const pad = (input: number) => String(input).padStart(2, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function createEmptySubProduct(): SubProductImageState {
    return {
        price: '',
        stock: '1',
        size: '',
        color_name: '',
        color_hex: '',
        discount_type: '',
        discount_value: '',
        discount_starts_at: '',
        discount_ends_at: '',
        discount_usage_limit: '',
        photo_urls: [],
        galleryImages: [],
    };
}

function subProductFromProduct(subProduct: AdminSubProduct): SubProductImageState {
    return {
        id: subProduct.id,
        price: String(subProduct.price),
        stock: String(subProduct.stock),
        size: subProduct.size ?? '',
        color_name: subProduct.color_name ?? '',
        color_hex: subProduct.color_hex ?? '',
        discount_type: subProduct.discount_type ?? '',
        discount_value: subProduct.discount_value != null ? String(subProduct.discount_value) : '',
        discount_starts_at: toLocalInput(subProduct.discount_starts_at),
        discount_ends_at: toLocalInput(subProduct.discount_ends_at),
        discount_usage_limit: subProduct.discount_usage_limit != null ? String(subProduct.discount_usage_limit) : '',
        photo_urls: subProduct.photo_urls ?? [],
        galleryImages: (subProduct.photo_urls ?? []).map((path, index) => ({
            path,
            preview_url: subProduct.photo_preview_urls[index] ?? null,
        })),
    };
}

function serializeSubProducts(subProducts: SubProductImageState[]): SubProductFormData[] {
    return subProducts.map(({ galleryImages, ...subProduct }) => ({
        ...subProduct,
        photo_urls: galleryImages.map((image) => image.path),
    }));
}

function normalizePriceInput(value: string): string {
    return value.replace(/,/g, '').replace(/\D/g, '');
}

function formatPriceInput(value: string): string {
    if (!value) {
        return '';
    }

    return value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export default function ProductForm({ product, categories }: ProductFormProps) {
    const isEditing = Boolean(product);
    const initialSubProducts = product?.subproducts.length
        ? product.subproducts.map(subProductFromProduct)
        : [createEmptySubProduct()];
    const form = useForm<ProductFormData>({
        category_id: product?.category_id ? String(product.category_id) : '',
        title: product?.title ?? '',
        slug: product?.slug ?? '',
        excerpt: product?.excerpt ?? '',
        description: product?.description ?? '',
        is_active: product?.is_active ?? true,
        image_url: product?.image_url ?? '',
        subproducts: serializeSubProducts(initialSubProducts),
    });
    const [coverImage, setCoverImage] = useState<UploadedImage | null>(
        product?.image_url ? {
            path: product.image_url,
            preview_url: product.image_preview_url,
        } : null,
    );
    const [subProducts, setSubProducts] = useState<SubProductImageState[]>(initialSubProducts);
    const [isCoverUploading, setIsCoverUploading] = useState(false);
    const [isGalleryUploading, setIsGalleryUploading] = useState(false);
    const [imageUploadError, setImageUploadError] = useState<string | null>(null);
    const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null);
    const [pendingGalleryFiles, setPendingGalleryFiles] = useState<File[]>([]);
    const [pendingGalleryIndex, setPendingGalleryIndex] = useState(0);
    const [pendingSubProductIndex, setPendingSubProductIndex] = useState<number | null>(null);
    const pendingGalleryFile = pendingGalleryFiles[pendingGalleryIndex] ?? null;

    function setSubProductData(nextSubProducts: SubProductImageState[]) {
        setSubProducts(nextSubProducts);
        form.setData('subproducts', serializeSubProducts(nextSubProducts));
    }

    function submit(event: FormEvent) {
        event.preventDefault();

        form.transform((data) => ({
            ...data,
            image_url: coverImage?.path ?? data.image_url ?? '',
            subproducts: serializeSubProducts(subProducts),
            ...(product ? { _method: 'put' as const } : {}),
        }));

        if (product) {
            form.post(route('admin.products.update', product.id), {
                preserveScroll: true,
            });
            return;
        }

        form.post(route('admin.products.store'));
    }

    function generateSlug() {
        if (!form.data.title) {
            return;
        }

        window.axios.post<{ slug: string }>(route('admin.slugs.store'), { title: form.data.title })
            .then((response) => form.setData('slug', response.data.slug));
    }

    function updateSubProduct(index: number, updates: Partial<SubProductImageState>) {
        const nextSubProducts = subProducts.map((subProduct, currentIndex) => (
            currentIndex === index ? { ...subProduct, ...updates } : subProduct
        ));

        setSubProductData(nextSubProducts);
    }

    function handlePriceChange(index: number, value: string) {
        const normalized = normalizePriceInput(value);
        const numericValue = Number(normalized);

        if (normalized && numericValue > maxProductPrice) {
            updateSubProduct(index, { price: String(maxProductPrice) });
            return;
        }

        updateSubProduct(index, { price: normalized });
    }

    function addSubProduct() {
        setSubProductData([...subProducts, createEmptySubProduct()]);
    }

    function removeSubProduct(index: number) {
        if (subProducts.length === 1) {
            return;
        }

        const subProduct = subProducts[index];
        const nextSubProducts = subProducts.filter((_, currentIndex) => currentIndex !== index);

        setSubProductData(nextSubProducts);
        subProduct.galleryImages.forEach((image) => deleteUploadedImage(image.path));
    }

    function enqueueImages(files: File[], type: 'cover' | 'gallery') {
        const uploadForm = new FormData();
        uploadForm.append('type', type);
        files.forEach((file) => uploadForm.append('images[]', file));

        return window.axios.post<{ uploads: QueuedUpload[] }>(route('admin.products.images.store'), uploadForm, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            timeout: productImageRequestTimeout,
        });
    }

    async function pollQueuedUpload(uploadId: string): Promise<UploadedImage> {
        for (let attempt = 0; attempt < productImageMaxPolls; attempt += 1) {
            const response = await window.axios.get<UploadStatus>(route('admin.products.images.show', uploadId), {
                timeout: productImageRequestTimeout,
            });

            if (response.data.status === 'completed' && response.data.file) {
                return response.data.file;
            }

            if (response.data.status === 'failed') {
                throw new Error(response.data.message ?? 'Product image upload failed.');
            }

            await new Promise((resolve) => window.setTimeout(resolve, productImagePollInterval));
        }

        throw new Error('Product image upload timed out.');
    }

    function deleteUploadedImage(path: string) {
        return window.axios.delete(route('admin.products.images.destroy'), {
            data: { path },
            timeout: productImageRequestTimeout,
        });
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
        setIsCoverUploading(true);
        setImageUploadError(null);
        try {
            const response = await enqueueImages([file], 'cover');
            const queuedUpload = response.data.uploads[0];

            if (!queuedUpload) {
                return;
            }

            const uploaded = await pollQueuedUpload(queuedUpload.id);

            setCoverImage(uploaded);
            form.setData('image_url', uploaded.path);
            setPendingCoverFile(null);
        } catch (error) {
            setImageUploadError(error instanceof Error ? error.message : 'آپلود تصویر ناموفق بود.');
        } finally {
            URL.revokeObjectURL(previewUrl);
            setIsCoverUploading(false);
        }
    }

    function handleGalleryChange(index: number, event: ChangeEvent<HTMLInputElement>) {
        const files = Array.from(event.target.files ?? []);
        event.target.value = '';

        if (files.length === 0) {
            return;
        }

        setImageUploadError(null);
        setPendingSubProductIndex(index);
        setPendingGalleryFiles(files);
        setPendingGalleryIndex(0);
    }

    async function uploadCroppedGalleryImage({ file, previewUrl }: CropResult) {
        setIsGalleryUploading(true);
        setImageUploadError(null);
        try {
            const response = await enqueueImages([file], 'gallery');
            const queuedUpload = response.data.uploads[0];

            if (!queuedUpload) {
                return;
            }

            const uploaded = await pollQueuedUpload(queuedUpload.id);

            const targetIndex = pendingSubProductIndex;

            if (targetIndex === null) {
                return;
            }

            setSubProducts((currentSubProducts) => {
                const target = currentSubProducts[targetIndex];

                if (!target) {
                    return currentSubProducts;
                }

                const nextGallery = [...target.galleryImages, uploaded];
                const nextSubProducts = currentSubProducts.map((subProduct, index) => (
                    index === targetIndex
                        ? { ...subProduct, galleryImages: nextGallery, photo_urls: nextGallery.map((image) => image.path) }
                        : subProduct
                ));

                form.setData('subproducts', serializeSubProducts(nextSubProducts));

                return nextSubProducts;
            });

            if (pendingGalleryIndex >= pendingGalleryFiles.length - 1) {
                setPendingGalleryFiles([]);
                setPendingGalleryIndex(0);
                setPendingSubProductIndex(null);
                return;
            }

            setPendingGalleryIndex((currentIndex) => currentIndex + 1);
        } catch (error) {
            setImageUploadError(error instanceof Error ? error.message : 'آپلود تصاویر ناموفق بود.');
            setPendingGalleryFiles([]);
            setPendingGalleryIndex(0);
            setPendingSubProductIndex(null);
        } finally {
            URL.revokeObjectURL(previewUrl);
            setIsGalleryUploading(false);
        }
    }

    function cancelGalleryCrop() {
        setPendingGalleryFiles([]);
        setPendingGalleryIndex(0);
        setPendingSubProductIndex(null);
    }

    function removeCoverImage() {
        if (!coverImage) {
            return;
        }

        setCoverImage(null);
        form.setData('image_url', '');
        deleteUploadedImage(coverImage.path);
    }

    function removeGalleryImage(subProductIndex: number, imageIndex: number) {
        const subProduct = subProducts[subProductIndex];
        const image = subProduct?.galleryImages[imageIndex];
        if (!image) {
            return;
        }

        const nextGallery = subProduct.galleryImages.filter((_, currentIndex) => currentIndex !== imageIndex);
        const nextSubProducts = subProducts.map((currentSubProduct, currentIndex) => (
            currentIndex === subProductIndex
                ? { ...currentSubProduct, galleryImages: nextGallery, photo_urls: nextGallery.map((item) => item.path) }
                : currentSubProduct
        ));

        setSubProductData(nextSubProducts);
        deleteUploadedImage(image.path);
    }

    return (
        <AdminLayout title={isEditing ? 'ویرایش محصول' : 'محصول جدید'}>
            <AdminPageHeader title={isEditing ? 'ویرایش محصول' : 'محصول جدید'} description="اطلاعات محصول، قیمت، موجودی و تصاویر." />
            <Link href={route('admin.products.index')} className="mb-5 inline-block text-sm font-bold text-joordak-coral">بازگشت</Link>

            <AdminCard>
                <form onSubmit={submit} className="grid gap-5 md:grid-cols-2">
                    <AdminFormField label="دسته‌بندی" error={form.errors.category_id}>
                        <select value={form.data.category_id} onChange={(event) => form.setData('category_id', event.target.value)} className="w-full rounded-xl border-slate-200 text-sm">
                            <option value="">بدون دسته‌بندی</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>{category.name}</option>
                            ))}
                        </select>
                    </AdminFormField>
                    <AdminFormField label="عنوان" error={form.errors.title}>
                        <input value={form.data.title} onChange={(event) => form.setData('title', event.target.value)} className="w-full rounded-xl border-slate-200 text-sm" />
                    </AdminFormField>
                    <AdminFormField label="نامک" error={form.errors.slug}>
                        <div className="flex min-w-0 gap-2">
                            <input value={form.data.slug} onChange={(event) => form.setData('slug', event.target.value)} className="min-w-0 w-full rounded-xl border-slate-200 text-sm" />
                            <button type="button" onClick={generateSlug} className="shrink-0 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-600">ساخت</button>
                        </div>
                    </AdminFormField>
                    <AdminFormField label="خلاصه" error={form.errors.excerpt}>
                        <input value={form.data.excerpt} onChange={(event) => form.setData('excerpt', event.target.value)} className="w-full rounded-xl border-slate-200 text-sm" />
                    </AdminFormField>
                    <AdminFormField label="توضیحات" error={form.errors.description}>
                        <textarea value={form.data.description} onChange={(event) => form.setData('description', event.target.value)} rows={6} className="w-full rounded-xl border-slate-200 text-sm md:col-span-2" />
                    </AdminFormField>
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                        <input type="checkbox" checked={form.data.is_active} onChange={(event) => form.setData('is_active', event.target.checked)} className="rounded border-slate-300 text-joordak-coral" />
                        محصول فعال باشد
                    </label>
                    {imageUploadError && (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 md:col-span-2">
                            {imageUploadError}
                        </div>
                    )}
                    <AdminFormField label="تصویر اصلی" error={form.errors.image_url}>
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
                            {coverImage?.preview_url ? (
                                <div className="mb-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
                                    <img src={coverImage.preview_url} alt={form.data.title || 'تصویر محصول'} className="h-56 w-full object-cover" />
                                    <div className="flex min-w-0 flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
                                        <span className="truncate text-xs font-semibold text-slate-500">{coverImage.path}</span>
                                        <button type="button" onClick={removeCoverImage} className="shrink-0 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100">
                                            حذف تصویر
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <p className="mb-4 text-sm font-semibold text-slate-500">تصویر اصلی هنوز آپلود نشده است.</p>
                            )}
                            <p className="mb-3 text-xs font-semibold text-slate-500">
                                {PRODUCT_IMAGE_CROP_HINT}
                            </p>
                            <label className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-joordak px-4 py-2 text-sm font-bold text-white transition hover:bg-[#17475c]">
                                {isCoverUploading ? 'در حال آپلود...' : 'آپلود تصویر اصلی'}
                                <input type="file" accept="image/*" onChange={handleCoverChange} disabled={isCoverUploading} className="hidden" />
                            </label>
                        </div>
                    </AdminFormField>
                    <div className="space-y-4 md:col-span-2">
                        <div>
                            <div>
                                <h2 className="text-base font-black text-slate-800">زیرمحصول‌ها</h2>
                                <p className="mt-1 text-xs font-semibold text-slate-500">برای هر سایز/رنگ قیمت، موجودی و گالری جدا ثبت کنید.</p>
                            </div>
                        </div>
                        {subProducts.map((subProduct, subProductIndex) => (
                            <div key={subProduct.id ?? `new-${subProductIndex}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <h3 className="text-sm font-black text-slate-700">زیرمحصول {subProductIndex + 1}</h3>
                                    {subProducts.length > 1 && (
                                        <button type="button" onClick={() => removeSubProduct(subProductIndex)} className="shrink-0 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100">
                                            حذف زیرمحصول
                                        </button>
                                    )}
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <AdminFormField label="قیمت" labelHelper="ریال" error={form.errors[`subproducts.${subProductIndex}.price`]}>
                                        <input inputMode="numeric" value={formatPriceInput(subProduct.price)} onChange={(event) => handlePriceChange(subProductIndex, event.target.value)} className="w-full rounded-xl border-slate-200 text-sm" />
                                    </AdminFormField>
                                    <AdminFormField label="موجودی" error={form.errors[`subproducts.${subProductIndex}.stock`]}>
                                        <input type="number" min="0" value={subProduct.stock} onChange={(event) => updateSubProduct(subProductIndex, { stock: event.target.value })} className="w-full rounded-xl border-slate-200 text-sm" />
                                    </AdminFormField>
                                    <AdminFormField label="سایز" error={form.errors[`subproducts.${subProductIndex}.size`]}>
                                        <input value={subProduct.size} onChange={(event) => updateSubProduct(subProductIndex, { size: event.target.value })} placeholder="مثلاً S، M، ۱۸mm" className="w-full rounded-xl border-slate-200 text-sm" />
                                    </AdminFormField>
                                    <AdminFormField label="نام رنگ" error={form.errors[`subproducts.${subProductIndex}.color_name`]}>
                                        <input value={subProduct.color_name} onChange={(event) => updateSubProduct(subProductIndex, { color_name: event.target.value })} placeholder="مثلاً آبی، طلایی، نقره‌ای" className="w-full rounded-xl border-slate-200 text-sm" />
                                    </AdminFormField>
                                    <AdminFormField label="رنگ" error={form.errors[`subproducts.${subProductIndex}.color_hex`]}>
                                        <div className="flex min-w-0 items-center gap-3">
                                            <input
                                                type="color"
                                                value={subProduct.color_hex || '#cccccc'}
                                                onChange={(event) => updateSubProduct(subProductIndex, { color_hex: event.target.value })}
                                                className="h-11 w-16 shrink-0 cursor-pointer rounded-xl border border-slate-200 bg-white p-1"
                                            />
                                            <input
                                                value={subProduct.color_hex}
                                                onChange={(event) => updateSubProduct(subProductIndex, { color_hex: event.target.value })}
                                                placeholder="#RRGGBB"
                                                className="min-w-0 w-full rounded-xl border-slate-200 text-sm"
                                                dir="ltr"
                                            />
                                            <span className="h-8 w-8 shrink-0 rounded-lg border border-slate-200" style={{ backgroundColor: subProduct.color_hex || '#ffffff' }} />
                                        </div>
                                    </AdminFormField>
                                    <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        <h4 className="mb-3 text-xs font-black text-slate-700">تخفیف زیرمحصول</h4>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <AdminFormField label="نوع تخفیف" error={form.errors[`subproducts.${subProductIndex}.discount_type`]}>
                                                <select
                                                    value={subProduct.discount_type}
                                                    onChange={(event) => updateSubProduct(subProductIndex, { discount_type: event.target.value as DiscountTypeValue })}
                                                    className="w-full rounded-xl border-slate-200 text-sm"
                                                >
                                                    <option value="">بدون تخفیف</option>
                                                    <option value="percent">درصدی</option>
                                                    <option value="amount">مبلغ ثابت</option>
                                                </select>
                                            </AdminFormField>
                                            {subProduct.discount_type !== '' && (
                                                <>
                                                    <AdminFormField label={subProduct.discount_type === 'percent' ? 'درصد تخفیف' : 'مبلغ تخفیف'} labelHelper={subProduct.discount_type === 'percent' ? '۱ تا ۱۰۰' : 'ریال'} error={form.errors[`subproducts.${subProductIndex}.discount_value`]}>
                                                        <input type="number" min="1" value={subProduct.discount_value} onChange={(event) => updateSubProduct(subProductIndex, { discount_value: event.target.value })} className="w-full rounded-xl border-slate-200 text-sm" dir="ltr" />
                                                    </AdminFormField>
                                                    <AdminFormField label="شروع تخفیف" labelHelper="اختیاری" error={form.errors[`subproducts.${subProductIndex}.discount_starts_at`]}>
                                                        <input type="datetime-local" value={subProduct.discount_starts_at} onChange={(event) => updateSubProduct(subProductIndex, { discount_starts_at: event.target.value })} className="w-full rounded-xl border-slate-200 text-sm" dir="ltr" />
                                                    </AdminFormField>
                                                    <AdminFormField label="پایان تخفیف" labelHelper="اختیاری" error={form.errors[`subproducts.${subProductIndex}.discount_ends_at`]}>
                                                        <input type="datetime-local" value={subProduct.discount_ends_at} onChange={(event) => updateSubProduct(subProductIndex, { discount_ends_at: event.target.value })} className="w-full rounded-xl border-slate-200 text-sm" dir="ltr" />
                                                    </AdminFormField>
                                                    <AdminFormField label="محدودیت تعداد استفاده" labelHelper="اختیاری" error={form.errors[`subproducts.${subProductIndex}.discount_usage_limit`]}>
                                                        <input type="number" min="1" value={subProduct.discount_usage_limit} onChange={(event) => updateSubProduct(subProductIndex, { discount_usage_limit: event.target.value })} className="w-full rounded-xl border-slate-200 text-sm" dir="ltr" />
                                                    </AdminFormField>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <AdminFormField label="گالری تصاویر زیرمحصول" error={form.errors[`subproducts.${subProductIndex}.photo_urls`]}>
                                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
                                            {subProduct.galleryImages.length > 0 ? (
                                                <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                                    {subProduct.galleryImages.map((image, imageIndex) => (
                                                        <div key={`${image.path}-${imageIndex}`} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                                                            {image.preview_url ? (
                                                                <img src={image.preview_url} alt="" className="h-32 w-full object-cover" />
                                                            ) : (
                                                                <div className="flex h-32 items-center justify-center bg-slate-100 text-xs font-bold text-slate-400">
                                                                    بدون پیش‌نمایش
                                                                </div>
                                                            )}
                                                            <div className="space-y-2 p-3">
                                                                <p className="truncate text-xs font-semibold text-slate-500">{image.path}</p>
                                                                <button type="button" onClick={() => removeGalleryImage(subProductIndex, imageIndex)} className="w-full rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100">
                                                                    حذف تصویر
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="mb-4 text-sm font-semibold text-slate-500">هیچ تصویری برای گالری این زیرمحصول آپلود نشده است.</p>
                                            )}
                                            <p className="mb-3 text-xs font-semibold text-slate-500">
                                                {PRODUCT_IMAGE_GALLERY_CROP_HINT}
                                            </p>
                                            <label className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-joordak px-4 py-2 text-sm font-bold text-white transition hover:bg-[#17475c]">
                                                {isGalleryUploading && pendingSubProductIndex === subProductIndex ? 'در حال آپلود...' : 'آپلود تصاویر گالری'}
                                                <input type="file" accept="image/*" multiple onChange={(event) => handleGalleryChange(subProductIndex, event)} disabled={isGalleryUploading} className="hidden" />
                                            </label>
                                        </div>
                                    </AdminFormField>
                                </div>
                            </div>
                        ))}
                        <button type="button" onClick={addSubProduct} className="w-full rounded-2xl border border-dashed border-emerald-600 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100">
                            + افزودن زیرمحصول
                        </button>
                    </div>
                    <div className="md:col-span-2">
                        <button disabled={form.processing} className="rounded-xl bg-joordak px-5 py-2 text-sm font-bold text-white disabled:opacity-60">
                            {isEditing ? 'ذخیره تغییرات' : 'ساخت محصول'}
                        </button>
                    </div>
                </form>
            </AdminCard>
            <ImageCropperModal
                file={pendingCoverFile}
                title="برش تصویر اصلی محصول"
                description="کادر تصویر را تنظیم کنید؛ بعد از تایید، تصویر آپلود می‌شود."
                outputWidth={PRODUCT_IMAGE_UPLOAD_WIDTH}
                outputHeight={PRODUCT_IMAGE_UPLOAD_HEIGHT}
                fallbackName="product-image"
                isProcessing={isCoverUploading}
                onCancel={() => setPendingCoverFile(null)}
                onConfirm={uploadCroppedCover}
            />
            <ImageCropperModal
                file={pendingGalleryFile}
                title={`برش تصویر گالری ${pendingGalleryFiles.length ? pendingGalleryIndex + 1 : 0} از ${pendingGalleryFiles.length}`}
                description="هر تصویر گالری قبل از آپلود جداگانه برش داده می‌شود."
                outputWidth={PRODUCT_IMAGE_UPLOAD_WIDTH}
                outputHeight={PRODUCT_IMAGE_UPLOAD_HEIGHT}
                fallbackName="product-gallery-image"
                isProcessing={isGalleryUploading}
                onCancel={cancelGalleryCrop}
                onConfirm={uploadCroppedGalleryImage}
            />
        </AdminLayout>
    );
}
