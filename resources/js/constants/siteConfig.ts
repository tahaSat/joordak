export const siteConfig = {
    name: 'Joordak',
    nameFa: 'جردک',
    tagline: 'فروشگاه آنلاین جردک — استایل خود را از بالا تا پایین بسازید.',
    description: 'فروشگاه آنلاین جردک — استایل خود را از بالا تا پایین بسازید.',
    logoUrl: '/logo.svg',
    domain: 'joordak.shop',
    social: {
        instagram: { href: '#', label: '@joordak' },
        telegram: { href: '#', label: 't.me/joordak' },
        support: { href: '#', label: 't.me/joordakadmin' },
        bale: { href: '#', label: 'ble.ir/joordak' },
    },
    enamad: {
        url: 'https://trustseal.enamad.ir/?id=6560621&Code=rupx1wooXFf8YsYDBs6WEdOqhBgcUqlP',
        logoUrl: 'https://trustseal.enamad.ir/logo.aspx?id=6560621&Code=rupx1wooXFf8YsYDBs6WEdOqhBgcUqlP',
    },
} as const;

export const actionButtonClassName =
    'rounded-full bg-joordak-coral px-4 py-2 text-sm font-semibold text-white transition hover:translate-y-[-1px] hover:bg-joordak-coral-dark';

export const logoClassName = 'h-auto w-36 shrink-0 object-contain sm:w-44 lg:w-60';
