import { SITE_LOGO_URL } from '@/Components/ApplicationLogo';
import { Link, usePage } from '@inertiajs/react';
import ProductCard from '@/Components/ProductCard';
import { useOptimisticCart } from '@/hooks/useOptimisticCart';
import StorefrontLayout from '@/Layouts/StorefrontLayout';

interface Product {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    price: string | number;
    image_url: string | null;
    size: string | null;
    color_name: string | null;
    color_hex: string | null;
    size_count: number;
    color_count: number;
    sub_product_id: number | null;
    is_active?: boolean;
    stock: number;
}

interface Category {
    id: number;
    name: string;
    slug: string;
    image_url: string | null;
    products_count: number;
}

interface WelcomeProps {
    featuredProducts: Product[];
    categories: Category[];
    cartItems: Record<number, { quantity: number; cart_item_id: number }>;
    heroImageUrl?: string | null;
    heroTitle?: string | null;
    heroSubtitle?: string | null;
}

export default function Welcome({ featuredProducts, categories, cartItems, heroImageUrl, heroTitle, heroSubtitle }: WelcomeProps) {
    const { auth } = usePage<{ auth: { user: any } }>().props;
    const resolvedHeroTitle = heroTitle?.trim() || 'به جردک خوش آمدید';
    const resolvedHeroSubtitle = heroSubtitle?.trim() || 'فروشگاه آنلاین مد و پوشاک';
    const {
        cartItems: optimisticCartItems,
        addToCart,
        increaseQuantity,
        decreaseQuantity,
        isPending,
    } = useOptimisticCart(cartItems);

    return (
        <StorefrontLayout
            title="خانه"
            seo={{
                description: 'Joordak فروشگاه آنلاین زیورآلات، پیرسینگ، گردنبند و انگشتر.',
                image: heroImageUrl ?? SITE_LOGO_URL,
            }}
        >
            <section className="group relative flex h-[500px] items-center justify-center overflow-hidden rounded-3xl shadow-md shadow-slate-200/70">
                {heroImageUrl && (
                    <img
                        src={heroImageUrl}
                        alt="Home hero banner"
                        loading="eager"
                        decoding="async"
                        fetchPriority="high"
                        className="absolute inset-0 h-full w-full object-cover transition-[filter,transform] duration-500 ease-in-out group-hover:blur-md group-hover:scale-105"
                    />
                )}
                <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(120deg, rgba(28,88,114,0.75), rgba(28,88,114,0.45))' }} />
                <div className="relative z-10 text-center text-white max-w-[800px] p-5">
                    <h1 className="mt-4 text-[48px] font-black transition-transform duration-500 ease-in-out group-hover:scale-110">
                        {resolvedHeroTitle}
                    </h1>
                    <p className="mt-4 text-lg opacity-95 transition-transform duration-500 ease-in-out group-hover:scale-110">
                        {resolvedHeroSubtitle}
                    </p>
                    <div style={{ marginTop: '32px', display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link href={route('products.index')} className="transition-transform duration-300 ease-in-out hover:scale-110" style={{ backgroundColor: 'white', color: 'joordak-coral', padding: '12px 24px', borderRadius: '9999px', fontWeight: 'bold', textDecoration: 'none' }}>
                           خرید
                        </Link>
                    </div>
                </div>
            </section>

            <section style={{ marginBottom: '40px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', marginTop: '40px', fontWeight: 'bold' }}>
                    <h2>محصولات</h2>
                </div>
                <div className="flex items-stretch gap-3 overflow-x-auto scroll-smooth pb-4 [scrollbar-width:thin] md:gap-4">
                    {featuredProducts.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            cartItems={optimisticCartItems}
                            isAuthenticated={Boolean(auth.user)}
                            onAddToCart={addToCart}
                            onIncreaseQuantity={increaseQuantity}
                            onDecreaseQuantity={decreaseQuantity}
                            isCartActionPending={isPending}
                            variant="compact"
                        />
                    ))}
                    <Link
                        href={route('products.index')}
                        className="flex shrink-0 self-stretch flex-col items-center justify-center gap-2 px-3 font-bold text-joordak-coral no-underline transition-transform duration-300 ease-in-out hover:scale-105 md:gap-3 md:px-4"
                    >
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-joordak text-white md:h-12 md:w-12">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 md:h-6 md:w-6">
                                <path d="M15 18l-6-6 6-6" />
                            </svg>
                        </span>
                        <span className="text-sm">مشاهده بیشتر</span>
                    </Link>
                </div>
            </section>

            {categories.length > 0 && (
                <section style={{ marginBottom: '90px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', marginTop: '40px', fontWeight: 'bold' }}>
                        <h2>دسته بندی ها</h2>
                    </div>
                    <div className="flex gap-4 overflow-x-auto scroll-smooth pb-4 [scrollbar-width:thin]">
                        {categories.map((category) => (
                            <Link
                                key={category.id}
                                href={route('products.index', { category: category.slug })}
                                className="group shrink-0 overflow-hidden rounded-3xl border-[3px] border-joordak shadow-md shadow-slate-200/70 no-underline"
                                style={{ width: '200px', color: 'inherit' }}
                            >
                                {category.image_url ? (
                                    <img
                                        src={category.image_url}
                                        alt={category.name}
                                        loading="lazy"
                                        decoding="async"
                                        className="aspect-[3/2] w-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-125 group-active:scale-125"
                                    />
                                ) : (
                                    <div className="aspect-[3/2] w-full bg-gradient-to-br from-[joordak-soft] via-white to-[joordak-gradient] transition-transform duration-500 ease-in-out group-hover:scale-125 group-active:scale-125" />
                                )}
                                <div className="p-3 text-center">
                                    <div className="font-bold">{category.name}</div>
                                    <div className="mt-1 text-xs font-semibold text-stone-500">
                                        {category.products_count.toLocaleString()} محصول
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}
        </StorefrontLayout>
    );
}
