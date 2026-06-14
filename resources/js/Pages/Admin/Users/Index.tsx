import AdminCard from '@/Components/Admin/AdminCard';
import AdminDangerAction from '@/Components/Admin/AdminDangerAction';
import AdminEmptyState from '@/Components/Admin/AdminEmptyState';
import AdminPageHeader from '@/Components/Admin/AdminPageHeader';
import AdminPagination from '@/Components/Admin/AdminPagination';
import AdminTable from '@/Components/Admin/AdminTable';
import AdminLayout from '@/Layouts/AdminLayout';
import { formatDateFa } from '@/lib/format';
import type { AdminManagedUser, Paginated } from '@/types/admin';
import { Link, router } from '@inertiajs/react';
import { FormEvent, useState } from 'react';

interface UserIndexProps {
    users: Paginated<AdminManagedUser>;
    filters: {
        search?: string;
        role?: string;
    };
    roles: Record<string, string>;
}

export default function UserIndex({ users, filters, roles }: UserIndexProps) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [role, setRole] = useState(filters.role ?? '');

    function submit(event: FormEvent) {
        event.preventDefault();
        router.get(route('admin.users.index'), { search, role }, { preserveState: true, preserveScroll: true });
    }

    return (
        <AdminLayout title="کاربران">
            <AdminPageHeader title="کاربران" description="مدیریت مشتریان و ادمین‌ها." actionHref={route('admin.users.create')} actionLabel="کاربر جدید" />
            <AdminCard className="mb-5">
                <form onSubmit={submit} className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
                    <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="نام، ایمیل یا موبایل" className="rounded-xl border-slate-200 text-sm" />
                    <select value={role} onChange={(event) => setRole(event.target.value)} className="rounded-xl border-slate-200 text-sm">
                        <option value="">همه نقش‌ها</option>
                        {Object.entries(roles).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                    <button type="submit" className="rounded-xl bg-joordak px-4 py-2 text-sm font-bold text-white">جستجو</button>
                </form>
            </AdminCard>
            <AdminCard>
                {users.data.length === 0 ? (
                    <AdminEmptyState message="کاربری پیدا نشد." />
                ) : (
                    <>
                        <AdminTable headers={['نام', 'موبایل', 'ایمیل', 'نقش', 'تاریخ عضویت', '']}>
                            {users.data.map((user) => (
                                <tr key={user.id}>
                                    <td className="px-4 py-3 font-bold">{[user.name, user.surname].filter(Boolean).join(' ')}</td>
                                    <td className="whitespace-nowrap px-4 py-3">{user.phone}</td>
                                    <td className="whitespace-nowrap px-4 py-3">{user.email ?? '—'}</td>
                                    <td className="whitespace-nowrap px-4 py-3">{roles[user.role] ?? user.role}</td>
                                    <td className="whitespace-nowrap px-4 py-3">{formatDateFa(user.created_at)}</td>
                                    <td className="whitespace-nowrap px-4 py-3">
                                        <div className="flex gap-2">
                                            <Link href={route('admin.users.edit', user.id)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50">ویرایش</Link>
                                            <AdminDangerAction href={route('admin.users.destroy', user.id)} label="حذف" />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </AdminTable>
                        <AdminPagination items={users} />
                    </>
                )}
            </AdminCard>
        </AdminLayout>
    );
}
