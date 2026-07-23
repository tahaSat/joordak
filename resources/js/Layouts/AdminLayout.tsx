import { SITE_LOGO_URL } from '@/Components/ApplicationLogo';
import type { PageProps } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    IconArticle,
    IconCategory,
    IconChartBar,
    IconDiscount2,
    IconHomeStats,
    IconPackage,
    IconReceipt,
    IconSettings,
    IconUsers,
    type Icon,
} from '@tabler/icons-react';
import { useEffect, useState, type ReactNode } from 'react';

interface AdminLayoutProps {
    title: string;
    children: ReactNode;
}

type AdminPageProps = PageProps<{
    flash?: {
        status?: string;
    };
}>;

interface NavItem {
    label: string;
    routeName: string;
    icon: Icon;
}

const navItems: NavItem[] = [
    { label: 'داشبورد', routeName: 'admin.dashboard', icon: IconHomeStats },
    { label: 'آمار', routeName: 'admin.stats', icon: IconChartBar },
    { label: 'سفارشات', routeName: 'admin.invoices.index', icon: IconReceipt },
    { label: 'محصولات', routeName: 'admin.products.index', icon: IconPackage },
    { label: 'دسته‌بندی‌ها', routeName: 'admin.categories.index', icon: IconCategory },
    { label: 'کدهای تخفیف', routeName: 'admin.discount-codes.index', icon: IconDiscount2 },
    { label: 'وبلاگ', routeName: 'admin.blog-posts.index', icon: IconArticle },
    { label: 'کاربران', routeName: 'admin.users.index', icon: IconUsers },
    { label: 'تنظیمات', routeName: 'admin.settings.edit', icon: IconSettings },
];

export default function AdminLayout({ title, children }: AdminLayoutProps) {
    const { props, url } = usePage<AdminPageProps>();
    const user = props.auth.user;
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
        if (typeof window === 'undefined') {
            return true;
        }

        return window.localStorage.getItem('adminSidebarOpen') !== 'false';
    });

    const toggleSidebar = () => {
        setIsSidebarOpen((previousState) => {
            const nextState = !previousState;
            window.localStorage.setItem('adminSidebarOpen', String(nextState));

            return nextState;
        });
    };

    useEffect(() => {
        const duckWindow = window as typeof window & {
            joordakDuck?: {
                stop?: () => void;
                destroy?: () => void;
            };
        };

        duckWindow.joordakDuck?.stop?.();
        duckWindow.joordakDuck?.destroy?.();
        delete duckWindow.joordakDuck;

        document.querySelectorAll('script[src="/duck.js"], script[src$="/duck.js"]').forEach((element) => element.remove());
        document.querySelectorAll('.duck, .duck-dialog-bubble').forEach((element) => element.remove());
    }, []);

    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [url]);

    return (
        <>
            <Head title={title}>
                <meta head-key="robots" name="robots" content="noindex, nofollow" />
            </Head>
            <div className="min-h-screen bg-slate-100 text-slate-800" dir="rtl">
                <aside
                    className={`fixed inset-y-0 right-0 z-40 hidden border-l border-slate-200 bg-white p-5 transition-all duration-300 lg:block ${isSidebarOpen ? 'w-72' : 'w-20'}`}
                    aria-label="منوی مدیریت"
                >
                    <div className={`mb-8 flex items-center ${isSidebarOpen ? 'justify-between gap-3' : 'justify-center'}`}>
                        {isSidebarOpen && (
                            <Link href={route('admin.dashboard')} className="flex items-center gap-3">
                                <img src={SITE_LOGO_URL} alt="Joordak" className="h-10 max-w-full object-contain" />
                            </Link>
                        )}
                        <button
                            type="button"
                            onClick={toggleSidebar}
                            aria-label={isSidebarOpen ? 'بستن منوی مدیریت' : 'باز کردن منوی مدیریت'}
                            aria-expanded={isSidebarOpen}
                            className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                        >
                            <span
                                className={`block h-0.5 rounded-full bg-current transition-all duration-300 ${isSidebarOpen ? 'w-5' : 'w-7'}`}
                                aria-hidden="true"
                            />
                            <span
                                className={`mt-1.5 block h-0.5 rounded-full bg-current transition-all duration-300 ${isSidebarOpen ? 'w-5' : 'w-4'}`}
                                aria-hidden="true"
                            />
                        </button>
                    </div>
                    <nav className="space-y-2">
                        {navItems.map((item) => {
                            const active = route().current(item.routeName) || route().current(`${item.routeName.replace('.index', '')}.*`);
                            const NavIcon = item.icon;

                            return (
                                <Link
                                    key={item.routeName}
                                    href={route(item.routeName)}
                                    className={`flex items-center rounded-xl px-4 py-3 text-sm font-bold transition ${isSidebarOpen ? 'gap-3' : 'justify-center'} ${active ? 'bg-joordak-coral text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                                    title={item.label}
                                >
                                    <NavIcon className="h-5 w-5 shrink-0" stroke={2} aria-hidden="true" />
                                    <span className={isSidebarOpen ? '' : 'sr-only'}>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </aside>

                <div className={`transition-all duration-300 ${isSidebarOpen ? 'lg:pr-72' : 'lg:pr-20'}`}>
                    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
                        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between sm:px-6 lg:px-8">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-base font-black uppercase tracking-wide text-slate-500">{user?.name} {user?.surname} </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsMobileMenuOpen((previousState) => !previousState)}
                                    aria-label={isMobileMenuOpen ? 'بستن منوی مدیریت' : 'باز کردن منوی مدیریت'}
                                    aria-expanded={isMobileMenuOpen}
                                    className="inline-flex flex-col items-end gap-1.5 rounded-xl border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-50 lg:hidden"
                                >
                                    <span
                                        className={`h-0.5 rounded-full bg-current transition-all duration-300 ${isMobileMenuOpen ? 'w-5' : 'w-7'}`}
                                        aria-hidden="true"
                                    />
                                    <span
                                        className={`h-0.5 rounded-full bg-current transition-all duration-300 ${isMobileMenuOpen ? 'w-5' : 'w-4'}`}
                                        aria-hidden="true"
                                    />
                                </button>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-sm">
                                <Link href={route('landing')} className="rounded-full border border-joordak-coral bg-joordak-coral px-3 py-2 font-bold text-white hover:bg-joordak-coral-dark">
                                    مشاهده سایت
                                </Link>
                            </div>
                        </div>
                        <div
                            className={`border-t border-slate-100 px-4 transition-all duration-500 ease-out lg:hidden ${isMobileMenuOpen ? 'max-h-none py-4 opacity-100' : 'pointer-events-none max-h-0 overflow-hidden py-0 opacity-0'}`}
                        >
                            <nav className="flex flex-col gap-2">
                                {navItems.map((item) => {
                                    const active = route().current(item.routeName) || route().current(`${item.routeName.replace('.index', '')}.*`);
                                    const NavIcon = item.icon;

                                    return (
                                        <Link
                                            key={`mobile-${item.routeName}`}
                                            href={route(item.routeName)}
                                            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition ${active ? 'bg-joordak-coral text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'}`}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            <NavIcon className="h-5 w-5 shrink-0" stroke={2} aria-hidden="true" />
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>
                    </header>

                    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                        {props.flash?.status && (
                            <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
                                {props.flash.status}
                            </div>
                        )}
                        {user?.role !== 'admin' && (
                            <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
                                دسترسی مدیریت فقط برای ادمین‌ها فعال است.
                            </div>
                        )}
                        {children}
                    </main>
                </div>
            </div>
        </>
    );
}
