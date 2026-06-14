import AdminCard from '@/Components/Admin/AdminCard';
import AdminFormField from '@/Components/Admin/AdminFormField';
import AdminPageHeader from '@/Components/Admin/AdminPageHeader';
import AdminLayout from '@/Layouts/AdminLayout';
import type { AdminDiscountCode, DiscountType } from '@/types/admin';
import { Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

interface DiscountCodeFormProps {
    discountCode: AdminDiscountCode | null;
    typeLabels: Record<string, string>;
}

interface DiscountCodeFormData {
    code: string;
    type: DiscountType;
    value: string;
    max_discount: string;
    starts_at: string;
    ends_at: string;
    usage_limit: string;
    is_active: boolean;
    [key: string]: string | boolean;
}

function toLocalInput(value: string | null): string {
    if (!value) {
        return '';
    }

    const date = new Date(value);
    const pad = (input: number) => String(input).padStart(2, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function DiscountCodeForm({ discountCode, typeLabels }: DiscountCodeFormProps) {
    const isEditing = Boolean(discountCode);
    const form = useForm<DiscountCodeFormData>({
        code: discountCode?.code ?? '',
        type: discountCode?.type ?? 'percent',
        value: discountCode ? String(discountCode.value) : '',
        max_discount: discountCode?.max_discount != null ? String(discountCode.max_discount) : '',
        starts_at: toLocalInput(discountCode?.starts_at ?? null),
        ends_at: toLocalInput(discountCode?.ends_at ?? null),
        usage_limit: discountCode?.usage_limit != null ? String(discountCode.usage_limit) : '',
        is_active: discountCode?.is_active ?? true,
    });

    const isPercent = form.data.type === 'percent';

    function submit(event: FormEvent) {
        event.preventDefault();

        if (discountCode) {
            form.put(route('admin.discount-codes.update', discountCode.id), { preserveScroll: true });
            return;
        }

        form.post(route('admin.discount-codes.store'));
    }

    return (
        <AdminLayout title={isEditing ? 'ویرایش کد تخفیف' : 'کد تخفیف جدید'}>
            <AdminPageHeader title={isEditing ? 'ویرایش کد تخفیف' : 'کد تخفیف جدید'} description="کد، نوع، مقدار و محدودیت‌های کد تخفیف فاکتور." />
            <Link href={route('admin.discount-codes.index')} className="mb-5 inline-block text-sm font-bold text-joordak-coral">بازگشت</Link>

            <AdminCard>
                <form onSubmit={submit} className="grid gap-5 md:grid-cols-2">
                    <AdminFormField label="کد" error={form.errors.code}>
                        <input value={form.data.code} onChange={(event) => form.setData('code', event.target.value)} className="w-full rounded-xl border-slate-200 text-sm" dir="ltr" />
                    </AdminFormField>
                    <AdminFormField label="نوع تخفیف" error={form.errors.type}>
                        <select value={form.data.type} onChange={(event) => form.setData('type', event.target.value as DiscountType)} className="w-full rounded-xl border-slate-200 text-sm">
                            {Object.entries(typeLabels).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                    </AdminFormField>
                    <AdminFormField label={isPercent ? 'درصد تخفیف' : 'مبلغ تخفیف'} labelHelper={isPercent ? '۱ تا ۱۰۰' : 'ریال'} error={form.errors.value}>
                        <input type="number" min="1" value={form.data.value} onChange={(event) => form.setData('value', event.target.value)} className="w-full rounded-xl border-slate-200 text-sm" dir="ltr" />
                    </AdminFormField>
                    {isPercent && (
                        <AdminFormField label="حداکثر مبلغ تخفیف" labelHelper="ریال (اختیاری)" error={form.errors.max_discount}>
                            <input type="number" min="0" value={form.data.max_discount} onChange={(event) => form.setData('max_discount', event.target.value)} className="w-full rounded-xl border-slate-200 text-sm" dir="ltr" />
                        </AdminFormField>
                    )}
                    <AdminFormField label="شروع اعتبار" labelHelper="اختیاری" error={form.errors.starts_at}>
                        <input type="datetime-local" value={form.data.starts_at} onChange={(event) => form.setData('starts_at', event.target.value)} className="w-full rounded-xl border-slate-200 text-sm" dir="ltr" />
                    </AdminFormField>
                    <AdminFormField label="پایان اعتبار" labelHelper="اختیاری" error={form.errors.ends_at}>
                        <input type="datetime-local" value={form.data.ends_at} onChange={(event) => form.setData('ends_at', event.target.value)} className="w-full rounded-xl border-slate-200 text-sm" dir="ltr" />
                    </AdminFormField>
                    <AdminFormField label="محدودیت تعداد استفاده" labelHelper="اختیاری" error={form.errors.usage_limit}>
                        <input type="number" min="1" value={form.data.usage_limit} onChange={(event) => form.setData('usage_limit', event.target.value)} className="w-full rounded-xl border-slate-200 text-sm" dir="ltr" />
                    </AdminFormField>
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700 md:col-span-2">
                        <input type="checkbox" checked={form.data.is_active} onChange={(event) => form.setData('is_active', event.target.checked)} className="rounded border-slate-300 text-joordak-coral" />
                        کد تخفیف فعال باشد
                    </label>
                    <div className="md:col-span-2">
                        <button disabled={form.processing} className="rounded-xl bg-joordak px-5 py-2 text-sm font-bold text-white disabled:opacity-60">
                            {isEditing ? 'ذخیره تغییرات' : 'ساخت کد تخفیف'}
                        </button>
                    </div>
                </form>
            </AdminCard>
        </AdminLayout>
    );
}
