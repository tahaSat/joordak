import Dropdown from '@/Components/Dropdown';
import { SITE_LOGO_URL } from '@/Components/ApplicationLogo';
import { loginUrl } from '@/lib/auth';
import type { PageProps } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { ReactNode, useEffect, useRef, useState } from 'react';

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

function CountBadge({ count }: { count: number }) {
    if (count <= 0) {
        return null;
    }

    return (
        <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold leading-none text-white">
            {count > 99 ? '99+' : count}
        </span>
    );
}

interface FooterLink {
    label: string;
    href: string;
    value: string;
}

import { actionButtonClassName, logoClassName, siteConfig } from '@/constants/siteConfig';

const siteName = siteConfig.name;
const defaultDescription = siteConfig.description;
const footerLinks: FooterLink[] = [
    {
        label: 'پیج اینستاگرام',
        href: siteConfig.social.instagram.href,
        value: siteConfig.social.instagram.label,
    },
    {
        label: 'کانال تلگرام',
        href: siteConfig.social.telegram.href,
        value: siteConfig.social.telegram.label,
    },
    {
        label: 'پشتیبانی',
        href: siteConfig.social.support.href,
        value: siteConfig.social.support.label,
    },
    {
        label: 'بله',
        href: siteConfig.social.bale.href,
        value: siteConfig.social.bale.label,
    },
];
const enamadUrl = siteConfig.enamad.url;
const enamadLogoUrl = siteConfig.enamad.logoUrl;
// const zibalTrustScriptUrl = 'https://zibal.ir/trust/scripts/zibal-trust-v4.js';

/*
function ZibalTrustBadge() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [shouldLoad, setShouldLoad] = useState(false);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) {
            return;
        }

        if (!('IntersectionObserver' in window)) {
            setShouldLoad(true);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setShouldLoad(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '300px' },
        );

        observer.observe(container);

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const container = containerRef.current;
        if (!shouldLoad || !container || container.querySelector('script[src*="zibal-trust-v4.js"]')) {
            return;
        }

        const script = document.createElement('script');
        script.src = zibalTrustScriptUrl;
        script.type = 'text/javascript';
        container.appendChild(script);

        return () => {
            container.querySelector('#zibal-trust-badge')?.remove();
            script.remove();
        };
    }, [shouldLoad]);

    return (
        <div
            ref={containerRef}
            className="flex h-24 w-24 items-center justify-center rounded-2xl border border-white/20 bg-white p-2.5 shadow-sm"
        />
    );
}
*/

function LazyEnamadBadge() {
    const containerRef = useRef<HTMLAnchorElement>(null);
    const [shouldLoad, setShouldLoad] = useState(false);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) {
            return;
        }

        if (!('IntersectionObserver' in window)) {
            setShouldLoad(true);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setShouldLoad(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '300px' },
        );

        observer.observe(container);

        return () => observer.disconnect();
    }, []);

    return (
        <a
            ref={containerRef}
            referrerPolicy="origin"
            target="_blank"
            rel="noopener noreferrer"
            href={enamadUrl}
            className="flex h-24 w-24 items-center justify-center rounded-2xl border border-white/20 bg-white p-2.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            aria-label="مشاهده نماد اعتماد الکترونیکی Joordak"
        >
            {shouldLoad && (
                <img
                    referrerPolicy="origin"
                    src={enamadLogoUrl}
                    alt="نماد اعتماد الکترونیکی"
                    className="max-h-full max-w-full object-contain"
                    loading="lazy"
                    decoding="async"
                    {...{ code: '92hoaKWWiMFPHhlDdGWRCXYwG4ftr1Mj' }}
                />
            )}
        </a>
    );
}

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
    const { auth, cartCount, pendingPaymentInvoicesCount } = props;
    const user = auth.user;
    const displayName = user ? [user.name, user.surname].filter(Boolean).join(' ') || user.phone || user.email || 'حساب کاربری' : '';
    const description = seo?.description?.trim() || defaultDescription;
    const canonicalUrl = seo?.canonicalUrl ?? toAbsoluteUrl(url);
    const imageUrl = toAbsoluteUrl(seo?.image);
    const fullTitle = `${title} - ${siteName}`;

    const navItems: NavItem[] = [
        { label: 'خانه', href: route('landing') },
        { label: 'محصولات', href: route('products.index') },
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
            <div className="relative flex min-h-screen flex-col bg-white text-slate-800">
                <header className="sticky top-0 z-50 bg-joordak">
                    <div className="relative mx-auto flex max-w-[1480px] items-center justify-between gap-6 px-6 py-4 sm:px-10 lg:px-16">
                        {user && cartCount > 0 ? (
                            <>
                                <Link
                                    href={route('cart.index')}
                                    className="rounded-full bg-joordak-coral px-4 py-2 text-sm font-semibold text-white transition hover:translate-y-[-1px] hover:bg-white/90 lg:hidden"
                                >
                                    سبد خرید ({cartCount})
                                </Link>
                                <Link href={route('landing')} className="hidden items-center gap-3 lg:flex">
                                    <img src={SITE_LOGO_URL} alt="فروشگاه جردک" decoding="async" className="h-9 w-auto object-contain lg:h-11" />
                                </Link>
                            </>
                        ) : (
                            <Link href={route('landing')} className="flex items-center gap-3">
                                <img src={SITE_LOGO_URL} alt="فروشگاه جردک" decoding="async" className="h-9 w-auto object-contain lg:h-11" />
                            </Link>
                        )}

                        <button
                            type="button"
                            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                            aria-label={isMobileMenuOpen ? 'بستن منو' : 'باز کردن منو'}
                            aria-expanded={isMobileMenuOpen}
                            className="inline-flex flex-col items-end gap-1.5 p-2 text-white lg:hidden"
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
                                    className="text-[1.05rem] font-semibold text-white transition hover:text-white/80"
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
                                        className="rounded-full bg-joordak-coral px-4 py-2 text-sm font-semibold text-white transition hover:translate-y-[-1px] hover:bg-white/90"
                                    >
                                        سبد خرید ({cartCount})
                                    </Link>
                                    <Dropdown>
                                        <Dropdown.Trigger>
                                            <span className="inline-flex rounded-full">
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20 focus:outline-none"
                                                >
                                                    {displayName}
                                                    <CountBadge count={pendingPaymentInvoicesCount} />
                                                    <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                </button>
                                            </span>
                                        </Dropdown.Trigger>

                                        <Dropdown.Content contentClasses="py-1 bg-white text-right">
                                            <Dropdown.Link href={route('dashboard')}>حساب کاربری</Dropdown.Link>
                                            <Dropdown.Link href={route('profile.edit')}>پروفایل</Dropdown.Link>
                                            <Dropdown.Link href={route('payment-history.index')} className="flex items-center justify-between gap-2">
                                                <span>پرداخت‌ها</span>
                                                <CountBadge count={pendingPaymentInvoicesCount} />
                                            </Dropdown.Link>
                                            {user.role === 'admin' && (
                                                <Dropdown.Link href={route('admin.dashboard')}>مدیریت</Dropdown.Link>
                                            )}
                                            <Dropdown.Link href={route('logout')} method="post" as="button">خروج</Dropdown.Link>
                                        </Dropdown.Content>
                                    </Dropdown>
                                </>
                            ) : (
                                <Link
                                    href={loginUrl(url)}
                                    className="rounded-full bg-joordak-coral px-5 py-2 text-sm font-semibold text-white transition hover:translate-y-[-1px] hover:bg-white/90"
                                >
                                    ورود
                                </Link>
                            )}
                        </div>
                    </div>

                    <div
                        className={`mx-auto mt-0 max-w-[1480px] px-6 transition-all duration-500 ease-out lg:hidden ${isMobileMenuOpen ? 'max-h-none py-6 pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+1rem))] opacity-100' : 'pointer-events-none max-h-0 overflow-hidden py-0 opacity-0'}`}
                    >
                        <div className="flex flex-col">
                            <nav className="flex flex-col items-center gap-6 text-center">
                                {navItems.map((item) => (
                                    <Link
                                        key={`mobile-${item.label}`}
                                        href={item.href}
                                        className="inline-flex items-center gap-2 text-[1.15rem] font-semibold text-white transition hover:text-white/80"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        {item.label}
                                        {item.href === route('payment-history.index') ? (
                                            <CountBadge count={pendingPaymentInvoicesCount} />
                                        ) : null}
                                    </Link>
                                ))}
                            </nav>

                            <div className="mt-6 flex flex-col items-center gap-3">
                                {user ? (
                                    <>
                                        <Link
                                            href={route('cart.index')}
                                            className="w-full rounded-full bg-joordak-coral px-5 py-3 text-center text-lg font-semibold text-white"
                                        >
                                            سبد خرید ({cartCount})
                                        </Link>
                                        {user.role === 'admin' && (
                                            <a href="/admin" className="text-[1.05rem] font-semibold text-white">
                                                مدیریت
                                            </a>
                                        )}
                                        <Link
                                            href={route('logout')}
                                            method="post"
                                            as="button"
                                            className="text-[1.05rem] font-semibold text-white"
                                        >
                                            خروج
                                        </Link>
                                    </>
                                ) : (
                                    <Link
                                        href={loginUrl(url)}
                                        className="w-full rounded-full bg-joordak-coral px-5 py-3 text-center text-lg font-semibold text-white"
                                    >
                                        ورود
                                    </Link>
                                )}
                            </div>

                            <div className="mt-6 h-px w-full bg-white/20" aria-hidden="true" />
                        </div>
                    </div>
                </header>

                <main className="mx-auto w-full max-w-[1480px] flex-1 px-5 pt-8 pb-10 sm:px-7 lg:px-10 xl:px-14">
                    {children}
                </main>
                <footer className="border-t border-white/10 bg-joordak text-white" dir="rtl">
                    <div className="mx-auto flex max-w-[1480px] flex-col gap-5 px-5 py-5 sm:px-7 lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:px-10 xl:px-14">
                        <div className="flex flex-col items-center gap-4 text-center text-sm text-white/90 sm:flex-row sm:items-center sm:justify-center sm:text-right lg:justify-start">
                            <div className="space-y-2 lg:flex lg:items-center lg:gap-5 lg:space-y-0">
                                <h2 className="font-bold text-white">ارتباط با ما</h2>
                                <div className="space-y-2 lg:flex lg:items-center lg:gap-5 lg:space-y-0">
                                    {footerLinks.map((item, index) => (
                                        <div key={item.label} className="lg:flex lg:items-center lg:gap-5">
                                            <a
                                                href={item.href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block transition hover:text-white/75"
                                            >
                                                <span className="font-semibold">{item.label}: </span>
                                                <span dir="ltr">{item.value}</span>
                                            </a>
                                            {index < footerLinks.length - 1 && (
                                                <span className="hidden text-white/45 lg:block" aria-hidden="true">
                                                    |
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 self-center lg:self-auto" dir="ltr">
                            {/* <ZibalTrustBadge /> */}
                            <LazyEnamadBadge />
                        </div>

                    </div>
                </footer>
            </div>
        </>
    );
}
