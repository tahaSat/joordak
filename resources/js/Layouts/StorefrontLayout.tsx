import Dropdown from '@/Components/Dropdown';
import type { PageProps } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { ReactNode, useEffect, useState } from 'react';

interface StorefrontLayoutProps {
    title: string;
    seo?: StorefrontSeo;
    children: ReactNode;
}

interface StorefrontSeo {
    description?: string;
    image?: string | null;
    canonicalUrl?: string;
    type?: 'website' | 'article' | 'product';
    noIndex?: boolean;
}

interface NavItem {
    label: string;
    href: string;
}

interface FooterLink {
    label: string;
    href: string;
    value: string;
}

const siteName = 'Joordak';
const defaultDescription = 'فروشگاه آنلاین جردک — استایل خود را از بالا تا پایین بسازید.';

// TODO: Replace with Joordak social URLs when provided
const footerLinks: FooterLink[] = [
    {
        label: 'پیج اینستاگرام',
        href: '#',
        value: '@joordak',
    },
    {
        label: 'کانال تلگرام',
        href: '#',
        value: 't.me/joordak',
    },
    {
        label: 'پشتیبانی',
        href: '#',
        value: 't.me/joordakadmin',
    },
    {
        label: 'بله',
        href: '#',
        value: 'ble.ir/joordak',
    },
];

// TODO: Replace with Joordak e-namad credentials when provided
const enamadUrl = '#';
const enamadLogoUrl = '/logo.svg';
const logoClassName = 'h-auto w-36 shrink-0 object-contain sm:w-44 lg:w-60';
const actionButtonClassName =
    'rounded-full bg-joordak-coral px-4 py-2 text-sm font-semibold text-white transition hover:translate-y-[-1px] hover:bg-joordak-coral-dark';

function toAbsoluteUrl(value?: string | null): string | undefined {
    if (!value) {
        return undefined;
    }

    if (typeof window === 'undefined') {
        return value;
    }

    return new URL(value, window.location.origin).toString();
}

export default function StorefrontLayout({ title, seo, children }: StorefrontLayoutProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { props, url } = usePage<PageProps>();
    const { auth, cartCount } = props;
    const user = auth.user;
    const displayName = user ? [user.name, user.surname].filter(Boolean).join(' ') || user.phone || user.email || 'حساب کاربری' : '';
    const description = seo?.description?.trim() || defaultDescription;
    const canonicalUrl = seo?.canonicalUrl ?? toAbsoluteUrl(url);
    const imageUrl = toAbsoluteUrl(seo?.image);
    const fullTitle = `${title} - ${siteName}`;

    const navItems: NavItem[] = [
        { label: 'خانه', href: route('landing') },
        { label: 'محصولات', href: route('products.index') },
        { label: 'وبلاگ', href: route('blog.index') },
        ...(user ? [
            { label: 'حساب کاربری', href: route('dashboard') },
            { label: 'پروفایل', href: route('profile.edit') },
            { label: 'پرداخت‌ها', href: route('payment-history.index') },
        ] : []),
    ];

    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [url]);

    return (
        <>
            <Head title={title}>
                <meta head-key="description" name="description" content={description} />
                <meta head-key="robots" name="robots" content={seo?.noIndex ? 'noindex, nofollow' : 'index, follow'} />
                {canonicalUrl && <link head-key="canonical" rel="canonical" href={canonicalUrl} />}
                <meta head-key="og:title" property="og:title" content={fullTitle} />
                <meta head-key="og:description" property="og:description" content={description} />
                <meta head-key="og:type" property="og:type" content={seo?.type ?? 'website'} />
                {canonicalUrl && <meta head-key="og:url" property="og:url" content={canonicalUrl} />}
                {imageUrl && <meta head-key="og:image" property="og:image" content={imageUrl} />}
                <meta head-key="twitter:title" name="twitter:title" content={fullTitle} />
                <meta head-key="twitter:description" name="twitter:description" content={description} />
                {imageUrl && <meta head-key="twitter:image" name="twitter:image" content={imageUrl} />}
            </Head>
            <div className="relative flex min-h-screen flex-col bg-white text-joordak-foreground">
                <header className="sticky top-0 z-50 bg-joordak text-joordak-foreground">
                    <div className="relative mx-auto flex max-w-[1480px] items-center justify-between gap-6 px-6 py-4 sm:px-10 lg:px-16">
                        <div className="flex shrink-0 items-center gap-3">
                            <Link href={route('landing')} className="flex shrink-0 items-center">
                                <img src="/logo.svg" alt="فروشگاه جردک" className={logoClassName} />
                            </Link>
                            {user && cartCount > 0 && (
                                <Link
                                    href={route('cart.index')}
                                    className={`${actionButtonClassName} lg:hidden`}
                                >
                                    سبد خرید ({cartCount})
                                </Link>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                            aria-label={isMobileMenuOpen ? 'بستن منو' : 'باز کردن منو'}
                            aria-expanded={isMobileMenuOpen}
                            className="inline-flex flex-col items-end gap-1.5 p-2 text-joordak-foreground lg:hidden"
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

                        <nav className="hidden items-center gap-8 lg:flex">
                            {navItems.map((item) => (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className="text-[1.05rem] font-semibold text-joordak-foreground transition hover:text-joordak-accent"
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </nav>

                        <div className="hidden items-center gap-4 lg:flex">
                            {user ? (
                                <>
                                    <Link
                                        href={route('cart.index')}
                                        className={actionButtonClassName}
                                    >
                                        سبد خرید ({cartCount})
                                    </Link>
                                    <Dropdown>
                                        <Dropdown.Trigger>
                                            <span className="inline-flex rounded-full">
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center rounded-full border border-joordak-foreground/15 bg-white/50 px-4 py-2 text-sm font-semibold text-joordak-foreground transition hover:bg-white/70 focus:outline-none"
                                                >
                                                    {displayName}
                                                    <svg className="ms-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                </button>
                                            </span>
                                        </Dropdown.Trigger>

                                        <Dropdown.Content contentClasses="py-1 bg-white text-right text-joordak-foreground">
                                            <Dropdown.Link href={route('dashboard')}>حساب کاربری</Dropdown.Link>
                                            <Dropdown.Link href={route('profile.edit')}>پروفایل</Dropdown.Link>
                                            <Dropdown.Link href={route('payment-history.index')}>پرداخت‌ها</Dropdown.Link>
                                            {user.role === 'admin' && (
                                                <Dropdown.Link href="/admin">مدیریت</Dropdown.Link>
                                            )}
                                            <Dropdown.Link href={route('logout')} method="post" as="button">خروج</Dropdown.Link>
                                        </Dropdown.Content>
                                    </Dropdown>
                                </>
                            ) : (
                                <Link
                                    href={route('login')}
                                    className={`${actionButtonClassName} px-5`}
                                >
                                    ورود
                                </Link>
                            )}
                        </div>
                    </div>

                    <div
                        className={`mx-auto mt-0 max-w-[1480px] overflow-hidden px-6 transition-all duration-500 ease-out lg:hidden ${isMobileMenuOpen ? 'max-h-[min(30rem,calc(100svh-5rem))] overflow-y-auto py-6 pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+1rem))] opacity-100' : 'pointer-events-none max-h-0 py-0 opacity-0'}`}
                    >
                        <div className="flex flex-col">
                            <nav className="flex flex-col items-center gap-6 text-center">
                                {navItems.map((item) => (
                                    <Link
                                        key={`mobile-${item.label}`}
                                        href={item.href}
                                        className="text-[1.15rem] font-semibold text-joordak-foreground transition hover:text-joordak-accent"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        {item.label}
                                    </Link>
                                ))}
                            </nav>

                            <div className="mt-6 flex flex-col items-center gap-3">
                                {user ? (
                                    <>
                                        <Link
                                            href={route('cart.index')}
                                            className="w-full rounded-full bg-joordak-coral px-5 py-3 text-center text-lg font-semibold text-white transition hover:bg-joordak-coral-dark"
                                        >
                                            سبد خرید ({cartCount})
                                        </Link>
                                        {user.role === 'admin' && (
                                            <a href="/admin" className="text-[1.05rem] font-semibold text-joordak-foreground">
                                                مدیریت
                                            </a>
                                        )}
                                        <Link
                                            href={route('logout')}
                                            method="post"
                                            as="button"
                                            className="text-[1.05rem] font-semibold text-joordak-foreground"
                                        >
                                            خروج
                                        </Link>
                                    </>
                                ) : (
                                    <Link
                                        href={route('login')}
                                        className="w-full rounded-full bg-joordak-coral px-5 py-3 text-center text-lg font-semibold text-white transition hover:bg-joordak-coral-dark"
                                    >
                                        ورود
                                    </Link>
                                )}
                            </div>

                            <div className="mt-6 h-px w-full bg-joordak-foreground/15" aria-hidden="true" />
                        </div>
                    </div>
                </header>

                <main className="mx-auto w-full max-w-[1480px] flex-1 px-5 pt-8 pb-10 sm:px-7 lg:px-10 xl:px-14">
                    {children}
                </main>
                <footer className="border-t border-joordak-foreground/10 bg-joordak text-joordak-foreground" dir="rtl">
                    <div className="mx-auto flex max-w-[1480px] flex-col gap-5 px-5 py-5 sm:px-7 lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:px-10 xl:px-14">
                        <div className="flex flex-col items-center gap-4 text-center text-sm text-joordak-foreground/90 sm:flex-row sm:items-center sm:justify-center sm:text-right lg:justify-start">
                            <div className="space-y-2 lg:flex lg:items-center lg:gap-5 lg:space-y-0">
                                <h2 className="font-bold text-joordak-foreground">ارتباط با ما</h2>
                                <div className="space-y-2 lg:flex lg:items-center lg:gap-5 lg:space-y-0">
                                    {footerLinks.map((item, index) => (
                                        <div key={item.label} className="lg:flex lg:items-center lg:gap-5">
                                            <a
                                                href={item.href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block transition hover:text-joordak-accent"
                                            >
                                                <span className="font-semibold">{item.label}: </span>
                                                <span dir="ltr">{item.value}</span>
                                            </a>
                                            {index < footerLinks.length - 1 && (
                                                <span className="hidden text-joordak-foreground/40 lg:block" aria-hidden="true">
                                                    |
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <a
                            referrerPolicy="origin"
                            target="_blank"
                            rel="noopener noreferrer"
                            href={enamadUrl}
                            className="flex h-24 w-24 items-center justify-center self-center rounded-2xl border border-joordak-foreground/15 bg-white p-2.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md lg:self-auto"
                            aria-label="مشاهده نماد اعتماد الکترونیکی Joordak"
                        >
                            <img
                                referrerPolicy="origin"
                                src={enamadLogoUrl}
                                alt="نماد اعتماد الکترونیکی"
                                className="max-h-full max-w-full object-contain"
                            />
                        </a>
                    </div>
                </footer>
            </div>
        </>
    );
}
