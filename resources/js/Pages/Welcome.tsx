import { Link, router, usePage } from '@inertiajs/react';
import { joordakColors } from '@/constants/theme';
import StorefrontLayout from '@/Layouts/StorefrontLayout';

interface Product {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    price: string | number;
    image_url: string | null;
}

interface BlogPost {
    id: number;
    title: string;
    excerpt: string | null;
    content: string;
    image_url: string | null;
}

interface PriceProps {
    amount: string | number;
}

interface WelcomeProps {
    featuredProducts: Product[];
    recentPosts: BlogPost[];
    cartItems: Record<number, { quantity: number; cart_item_id: number }>;
    heroImageUrl?: string | null;
}

function Price({ amount }: PriceProps) {
    return <span>﷼{Math.round(Number(amount)).toLocaleString()}</span>;
}

export default function Welcome({ featuredProducts, recentPosts, cartItems, heroImageUrl }: WelcomeProps) {
    const { auth } = usePage<{ auth: { user: any } }>().props;

    const addToCart = (productId: number) => {
        router.post(route('cart.store'), { product_id: productId, quantity: 1 }, { 
            preserveScroll: true,
            onSuccess: () => {
                router.reload({ only: ['cartItems'] });
            }
        });
    };

    const updateQuantity = (productId: number, quantity: number) => {
        const cartItemId = cartItems[productId]?.cart_item_id;
        if (!cartItemId) return;
        
        router.patch(route('cart.update', { cartItem: cartItemId }), { quantity }, { 
            preserveScroll: true,
            onSuccess: () => {
                router.reload({ only: ['cartItems'] });
            }
        });
    };

    const removeFromCart = (productId: number) => {
        const cartItemId = cartItems[productId]?.cart_item_id;
        if (!cartItemId) return;
        
        router.delete(route('cart.destroy', { cartItem: cartItemId }), { 
            preserveScroll: true,
            onSuccess: () => {
                router.reload({ only: ['cartItems'] });
            }
        });
    };

    return (
        <StorefrontLayout
            title="خانه"
            seo={{
                description: 'فروشگاه آنلاین جردک — استایل خود را از بالا تا پایین بسازید.',
                image: heroImageUrl ?? '/logo.svg',
            }}
        >
            <section className="relative h-[500px] rounded-3xl overflow-hidden flex items-center justify-center">
                {heroImageUrl && (
                    <img
                        src={heroImageUrl}
                        alt="Home hero banner"
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover"
                    />
                )}
                <div className="absolute inset-0" style={{ backgroundImage: joordakColors.heroOverlay }} />
                <div
                    className="relative z-10 max-w-3xl px-5 text-center text-joordak-foreground"
                    style={{ textShadow: joordakColors.heroTextShadow }}
                >
                    <h1 className="mt-2 flex flex-col gap-2 text-[48px] font-black md:flex-row md:justify-center md:gap-4">
                        <span>به</span>
                        <span className="text-joordak-accent">جردک</span>
                        <span>خوش</span>
                        <span>آمدید</span>
                    </h1>
                    <p className="mt-4 text-lg">
                        به استایلت از بالا به پایین نگاه کن
                    </p>
                    <div className="mt-8 flex flex-wrap justify-center gap-4">
                        <Link
                            href={route('products.index')}
                            className="rounded-full bg-joordak-coral px-6 py-3 font-bold text-white transition hover:bg-joordak-coral-dark"
                            style={{ boxShadow: joordakColors.heroButtonShadow }}
                        >
                            خرید
                        </Link>
                        <Link
                            href={route('blog.index')}
                            className="rounded-full border-2 border-joordak-foreground bg-white/95 px-6 py-3 font-bold text-joordak-foreground transition hover:bg-joordak-soft"
                            style={{ boxShadow: joordakColors.heroButtonShadow }}
                        >
                            وبلاگ
                        </Link>
                    </div>
                </div>
            </section>

            <section style={{ marginBottom: '90px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', marginTop: '40px' ,fontWeight:'bold'  }}>
                    <h2>محصولات</h2>
                    <Link href="/products" style={{ color: joordakColors.accent, textDecoration: 'none', fontWeight: 'bold' }}> همه</Link>
                </div>
                <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px' }}>
                    {featuredProducts.map((product) => (
                        <article key={product.id} style={{ flexShrink: 0, width: '288px', border: `1px solid ${joordakColors.border}`, borderRadius: '24px', overflow: 'hidden' }}>
                            <Link href={route('products.show', product.slug)} style={{ display: 'block', textDecoration: 'none' }}>
                                {product.image_url ? (
                                    <img
                                        src={product.image_url}
                                        alt={product.title}
                                        style={{ aspectRatio: '3 / 2', width: '100%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <div style={{ aspectRatio: '3 / 2', width: '100%', background: joordakColors.placeholderGradient }} />
                                )}
                            </Link>
                            <div style={{ padding: '16px' }}>
                                <Link href={route('products.show', product.slug)} style={{ display: 'block', color: 'inherit', textDecoration: 'none' }}>
                                    <h3 style={{ fontWeight: 'bold' }}>{product.title}</h3>
                                    <p style={{ marginTop: '8px', fontSize: '14px', color: joordakColors.text }}>{product.excerpt ?? 'محصول تازه اضافه شده.'}</p>
                                </Link>
                                <p style={{ marginTop: '16px', fontSize: '18px', fontWeight: 'bold', color: joordakColors.accent }}><Price amount={product.price} /></p>
                                {auth.user ? (
                                    cartItems[product.id]?.quantity ? (
                                        <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                                            <button
                                                type="button"
                                                onClick={() => updateQuantity(product.id, cartItems[product.id].quantity + 1)}
                                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '32px', width: '32px', borderRadius: '50%', backgroundColor: joordakColors.primary, color: joordakColors.foreground, border: 'none', cursor: 'pointer' }}
                                            >
                                                +
                                            </button>
                                            <span style={{ fontSize: '14px', fontWeight: 'bold', color: joordakColors.accent }}>{cartItems[product.id].quantity}</span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (cartItems[product.id].quantity > 1) {
                                                        updateQuantity(product.id, cartItems[product.id].quantity - 1);
                                                    } else {
                                                        removeFromCart(product.id);
                                                    }
                                                }}
                                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '32px', width: '32px', borderRadius: '50%', backgroundColor: joordakColors.primary, color: joordakColors.foreground, border: 'none', cursor: 'pointer' }}
                                            >
                                                -
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => addToCart(product.id)}
                                            style={{ marginTop: '16px', width: '100%', borderRadius: '8px', backgroundColor: joordakColors.primary, color: joordakColors.foreground, padding: '8px 16px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                                        >
                                            افزودن به سبد
                                        </button>
                                    )
                                ) : (
                                    <Link href={route('login')} style={{ marginTop: '16px', display: 'block', borderRadius: '8px', border: '1px solid #d6d6d6', padding: '8px 16px', textAlign: 'center', fontSize: '12px', textDecoration: 'none' }}>
                                        برای خرید وارد شوید
                                    </Link>
                                )}
                            </div>
                        </article>
                    ))}
                </div>
            </section>

            <section style={{ marginBottom: '40px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', marginTop: '40px' ,fontWeight:'bold'  }}>
                    <h2>آخرین مطالب وبلاگ</h2>
                    <Link href="/blog" style={{ color: joordakColors.accent, textDecoration: 'none', fontWeight: 'bold' }}> همه</Link>
                </div>
                <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px' }}>
                    {recentPosts.map((post) => (
                        <article key={post.id} style={{ flexShrink: 0, width: '288px', border: `1px solid ${joordakColors.border}`, borderRadius: '24px', overflow: 'hidden' }}>
                            {post.image_url ? (
                                <img
                                    src={post.image_url}
                                    alt={post.title}
                                    style={{ height: '192px', width: '100%', objectFit: 'cover' }}
                                />
                            ) : (
                                <div style={{ height: '192px', width: '100%', background: joordakColors.placeholderGradient }} />
                            )}
                            <div style={{ padding: '16px' }}>
                                <h3 style={{ fontWeight: 'bold' }}>{post.title}</h3>
                                <p style={{ marginTop: '8px', fontSize: '14px', color: joordakColors.text }}>{post.excerpt ?? post.content}</p>
                            </div>
                        </article>
                    ))}
                </div>
            </section>
        </StorefrontLayout>
    );
}
