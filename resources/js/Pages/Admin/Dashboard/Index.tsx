import AdminCard from '@/Components/Admin/AdminCard';
import AdminPageHeader from '@/Components/Admin/AdminPageHeader';
import AdminStatusBadge from '@/Components/Admin/AdminStatusBadge';
import AdminTable from '@/Components/Admin/AdminTable';
import AdminLayout from '@/Layouts/AdminLayout';
import { formatDateFa, formatNumberFa, formatPrice } from '@/lib/format';
import type { AdminInvoiceSummary } from '@/types/admin';
import { Link } from '@inertiajs/react';

interface DashboardStats {
    products: number;
    categories: number;
    blogPosts: number;
    users: number;
    usersChange: number;
    invoices: number;
    invoicesChange: number;
    revenue: number;
    revenueChange: number;
}

interface DashboardProps {
    stats: DashboardStats;
    recentInvoices: AdminInvoiceSummary[];
}

interface StatCard {
    label: string;
    value: number | string;
    href: string;
    trend?: number;
}

export default function DashboardIndex({ stats, recentInvoices }: DashboardProps) {
    const statCards: StatCard[] = [
        { label: 'محصولات', value: stats.products, href: route('admin.products.index') },
        { label: 'دسته‌بندی‌ها', value: stats.categories, href: route('admin.categories.index') },
        { label: 'مطالب وبلاگ', value: stats.blogPosts, href: route('admin.blog-posts.index') },
        {
            label: 'کاربران این ماه',
            value: stats.users,
            href: route('admin.users.index'),
            trend: stats.usersChange,
        },
        {
            label: 'سفارشات این ماه',
            value: stats.invoices,
            href: route('admin.invoices.index'),
            trend: stats.invoicesChange,
        },
        {
            label: 'درآمد این ماه',
            value: formatPrice(stats.revenue),
            href: route('admin.stats'),
            trend: stats.revenueChange,
        },
    ];

    const trendLabel = (trend: number): string => {
        if (trend === 0) {
            return 'بدون تغییر نسبت به ماه قبل';
        }

        return `${formatNumberFa(Math.abs(trend))}٪ ${trend > 0 ? 'افزایش' : 'کاهش'} نسبت به ماه قبل`;
    };

    return (
        <AdminLayout title="داشبورد مدیریت">
            <AdminPageHeader title="داشبورد مدیریت" description="نمای کلی فروشگاه و میانبرهای مدیریت." titleClassName="text-lg" />

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {statCards.map((stat) => (
                    <Link key={stat.label} href={stat.href}>
                        <AdminCard className="transition hover:-translate-y-0.5 hover:shadow-md">
                            <p className="text-sm font-bold text-slate-500">{stat.label}</p>
                            <p className="mt-3 text-2xl font-black text-joordak-coral">{stat.value}</p>
                            {stat.trend !== undefined && (
                                <p
                                    className={`mt-2 text-xs font-bold ${
                                        stat.trend > 0
                                            ? 'text-emerald-600'
                                            : stat.trend < 0
                                              ? 'text-rose-600'
                                              : 'text-slate-500'
                                    }`}
                                >
                                    {trendLabel(stat.trend)}
                                </p>
                            )}
                        </AdminCard>
                    </Link>
                ))}
            </div>

            <AdminCard className="mt-6">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-black text-slate-900">آخرین سفارشات</h2>
                    <Link href={route('admin.invoices.index')} className="text-sm font-bold text-joordak-coral">
                        مشاهده همه
                    </Link>
                </div>
                <AdminTable headers={['شماره', 'مشتری', 'وضعیت', 'مبلغ', 'تاریخ', '']}>
                    {recentInvoices.map((invoice) => (
                        <tr key={invoice.id}>
                            <td className="whitespace-nowrap px-4 py-3 font-bold">#{invoice.id}</td>
                            <td className="px-4 py-3">
                                <div className="font-bold text-slate-800">{invoice.customer_name || 'بدون نام'}</div>
                                <div className="text-xs text-slate-500">{invoice.customer_phone}</div>
                            </td>
                            <td className="px-4 py-3"><AdminStatusBadge status={invoice.status} /></td>
                            <td className="whitespace-nowrap px-4 py-3 font-bold">{formatPrice(invoice.total)}</td>
                            <td className="whitespace-nowrap px-4 py-3">{formatDateFa(invoice.created_at)}</td>
                            <td className="whitespace-nowrap px-4 py-3">
                                <Link href={route('admin.invoices.show', invoice.id)} className="font-bold text-joordak-coral">
                                    مشاهده
                                </Link>
                            </td>
                        </tr>
                    ))}
                </AdminTable>
            </AdminCard>
        </AdminLayout>
    );
}
