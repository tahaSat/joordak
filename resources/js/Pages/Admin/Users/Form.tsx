import AdminCard from '@/Components/Admin/AdminCard';
import AdminFormField from '@/Components/Admin/AdminFormField';
import AdminPageHeader from '@/Components/Admin/AdminPageHeader';
import AdminLayout from '@/Layouts/AdminLayout';
import { iranProvinces } from '@/constants/iranProvinces';
import type { AdminManagedUser } from '@/types/admin';
import { Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

interface UserFormProps {
    managedUser: AdminManagedUser | null;
    roles: Record<string, string>;
}

interface UserFormData {
    name: string;
    surname: string;
    email: string;
    phone: string;
    address: string;
    address_province: string;
    postal_code: string;
    role: string;
    email_verified_at: string;
    password: string;
    [key: string]: string;
}

export default function UserForm({ managedUser, roles }: UserFormProps) {
    const isEditing = Boolean(managedUser);
    const form = useForm<UserFormData>({
        name: managedUser?.name ?? '',
        surname: managedUser?.surname ?? '',
        email: managedUser?.email ?? '',
        phone: managedUser?.phone ?? '',
        address: managedUser?.address ?? '',
        address_province: managedUser?.address_province ?? '',
        postal_code: managedUser?.postal_code ?? '',
        role: managedUser?.role ?? 'customer',
        email_verified_at: managedUser?.email_verified_at ?? '',
        password: '',
    });

    function submit(event: FormEvent) {
        event.preventDefault();

        if (managedUser) {
            form.put(route('admin.users.update', managedUser.id), { preserveScroll: true });
            return;
        }

        form.post(route('admin.users.store'));
    }

    return (
        <AdminLayout title={isEditing ? 'ویرایش کاربر' : 'کاربر جدید'}>
            <AdminPageHeader title={isEditing ? 'ویرایش کاربر' : 'کاربر جدید'} description="اطلاعات حساب و نقش کاربر." />
            <Link href={route('admin.users.index')} className="mb-5 inline-block text-sm font-bold text-joordak-coral">بازگشت</Link>

            <AdminCard>
                <form onSubmit={submit} className="grid gap-5 md:grid-cols-2">
                    <AdminFormField label="نام" error={form.errors.name}>
                        <input value={form.data.name} onChange={(event) => form.setData('name', event.target.value)} className="w-full rounded-xl border-slate-200 text-sm" />
                    </AdminFormField>
                    <AdminFormField label="نام خانوادگی" error={form.errors.surname}>
                        <input value={form.data.surname} onChange={(event) => form.setData('surname', event.target.value)} className="w-full rounded-xl border-slate-200 text-sm" />
                    </AdminFormField>
                    <AdminFormField label="موبایل" error={form.errors.phone}>
                        <input value={form.data.phone} onChange={(event) => form.setData('phone', event.target.value)} className="w-full rounded-xl border-slate-200 text-sm" />
                    </AdminFormField>
                    <AdminFormField label="ایمیل" error={form.errors.email}>
                        <input type="email" value={form.data.email} onChange={(event) => form.setData('email', event.target.value)} className="w-full rounded-xl border-slate-200 text-sm" />
                    </AdminFormField>
                    <AdminFormField label="نقش" error={form.errors.role}>
                        <select value={form.data.role} onChange={(event) => form.setData('role', event.target.value)} className="w-full rounded-xl border-slate-200 text-sm">
                            {Object.entries(roles).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select>
                    </AdminFormField>
                    <AdminFormField label="تاریخ تایید ایمیل" error={form.errors.email_verified_at}>
                        <input type="datetime-local" value={form.data.email_verified_at} onChange={(event) => form.setData('email_verified_at', event.target.value)} className="w-full rounded-xl border-slate-200 text-sm" />
                    </AdminFormField>
                    <AdminFormField label={isEditing ? 'رمز جدید (اختیاری)' : 'رمز عبور'} error={form.errors.password}>
                        <input type="password" value={form.data.password} onChange={(event) => form.setData('password', event.target.value)} className="w-full rounded-xl border-slate-200 text-sm" />
                    </AdminFormField>
                    <AdminFormField label="کد پستی" error={form.errors.postal_code}>
                        <input value={form.data.postal_code} onChange={(event) => form.setData('postal_code', event.target.value)} className="w-full rounded-xl border-slate-200 text-sm" />
                    </AdminFormField>
                    <AdminFormField label="استان" error={form.errors.address_province}>
                        <input
                            type="search"
                            list="admin-iran-provinces"
                            value={form.data.address_province}
                            onChange={(event) => form.setData('address_province', event.target.value)}
                            placeholder="جستجوی استان"
                            className="w-full rounded-xl border-slate-200 text-sm"
                        />
                        <datalist id="admin-iran-provinces">
                            {iranProvinces.map((province) => (
                                <option key={province} value={province} />
                            ))}
                        </datalist>
                    </AdminFormField>
                    <AdminFormField label="آدرس" error={form.errors.address}>
                        <textarea value={form.data.address} onChange={(event) => form.setData('address', event.target.value)} rows={5} className="w-full rounded-xl border-slate-200 text-sm" />
                    </AdminFormField>
                    <div className="md:col-span-2">
                        <button disabled={form.processing} className="rounded-xl bg-joordak px-5 py-2 text-sm font-bold text-white disabled:opacity-60">
                            {isEditing ? 'ذخیره تغییرات' : 'ساخت کاربر'}
                        </button>
                    </div>
                </form>
            </AdminCard>
        </AdminLayout>
    );
}
