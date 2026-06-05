import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { PRODUCT_IMAGE_ASPECT_CLASS } from '@/constants/productImage';
import StorefrontLayout from '@/Layouts/StorefrontLayout';

interface Product {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    description: string | null;
    price: string | number;
    stock: number;
    image_url: string | null;
    photo_urls: string[] | null;
    category?: { id: number; name: string; slug: string } | null;
}

interface PriceProps {
    amount: string | number;
}

interface ProductShowProps {
    product: Product;
    galleryImages: string[];
    cartItems: Record<number, { quantity: number; cart_item_id: number }>;
}

function Price({ amount }: PriceProps) {
    return <span>﷼{Math.round(Number(amount)).toLocaleString()}</span>;
}

export default function ProductShow({ product, galleryImages, cartItems }: ProductShowProps) {
    const { auth, errors } = usePage<{ auth: { user: any }, errors: Record<string, string> }>().props;
    const [activeIndex, setActiveIndex] = useState(0);

    const images = galleryImages.length > 0 ? galleryImages : ['/logo.svg'];
    const activeImage = images[activeIndex] ?? images[0];
    const cartItem = cartItems[product.id];
    const cartQuantity = cartItem?.quantity ?? 0;
    const isOutOfStock = product.stock <= 0;
    const hasReachedStock = cartQuantity >= product.stock;

    const addToCart = () => {
        router.post(route('cart.store'), { product_id: product.id, quantity: 1 }, {
            preserveScroll: true,
            onSuccess: () => {
                router.reload({ only: ['cartItems'] });
            },
            onError: () => {
                // Keep validation feedback visible on the current page.
            }
        });
    };

    const updateQuantity = (quantity: number) => {
        if (!cartItem) return;

        router.patch(route('cart.update', { cartItem: cartItem.cart_item_id }), { quantity }, {
            preserveScroll: true,
            onSuccess: () => {
                router.reload({ only: ['cartItems'] });
            },
            onError: () => {
                // Keep validation feedback visible on the current page.
            }
        });
    };

    const removeFromCart = () => {
        if (!cartItem) return;

        router.delete(route('cart.destroy', { cartItem: cartItem.cart_item_id }), {
            preserveScroll: true,
            onSuccess: () => {
                router.reload({ only: ['cartItems'] });
            }
        });
    };

    const showPreviousImage = () => {
        setActiveIndex((current) => (current === 0 ? images.length - 1 : current - 1));
    };

    const showNextImage = () => {
        setActiveIndex((current) => (current === images.length - 1 ? 0 : current + 1));
    };

    return (
        <StorefrontLayout
            title={product.title}
            seo={{
                description: product.excerpt ?? product.description ?? undefined,
                image: activeImage,
                type: 'product',
            }}
        >
            <Link href={route('products.index')} className="text-sm font-semibold text-joordak-accent hover:opacity-80">
                بازگشت به محصولات
            </Link>

            <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
                <section className="space-y-4">
                    <div className="relative overflow-hidden rounded-3xl border border-joordak-border bg-joordak-soft">
                        <img
                            src={activeImage}
                            alt={product.title}
                            className={`${PRODUCT_IMAGE_ASPECT_CLASS} w-full object-cover`}
                        />

                        {images.length > 1 && (
                            <>
                                <button
                                    type="button"
                                    onClick={showNextImage}
                                    aria-label="تصویر بعدی"
                                    className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-xl font-bold text-joordak-accent shadow hover:bg-white"
                                >
                                    ›
                                </button>
                                <button
                                    type="button"
                                    onClick={showPreviousImage}
                                    aria-label="تصویر قبلی"
                                    className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-xl font-bold text-joordak-accent shadow hover:bg-white"
                                >
                                    ‹
                                </button>
                            </>
                        )}
                    </div>

                    {images.length > 1 && (
                        <div className="flex gap-3 overflow-x-auto pb-2">
                            {images.map((image, index) => (
                                <button
                                    key={`${image}-${index}`}
                                    type="button"
                                    onClick={() => setActiveIndex(index)}
                                    className={`w-20 flex-shrink-0 overflow-hidden rounded-xl border-2 bg-white ${
                                        activeIndex === index ? 'border-joordak' : 'border-transparent'
                                    }`}
                                >
                                    <img src={image} alt={`${product.title} ${index + 1}`} className={`${PRODUCT_IMAGE_ASPECT_CLASS} w-full object-cover`} />
                                </button>
                            ))}
                        </div>
                    )}
                </section>

                <section className="h-fit rounded-3xl border border-joordak-border bg-white p-6 shadow-sm">
                    {product.category && (
                        <p className="text-xs font-semibold uppercase tracking-wider text-joordak-foreground">{product.category.name}</p>
                    )}
                    <h1 className="mt-2 text-3xl font-black text-joordak-accent">{product.title}</h1>
                    {product.excerpt && <p className="mt-3 text-joordak-foreground">{product.excerpt}</p>}

                    <div className="mt-6 flex items-center justify-between rounded-2xl bg-joordak-soft p-4">
                        <span className="text-sm text-joordak-foreground">قیمت</span>
                        <span className="text-2xl font-black text-joordak-accent"><Price amount={product.price} /></span>
                    </div>

                    <p className="mt-4 text-sm font-semibold text-joordak-foreground">
                        {isOutOfStock ? 'ناموجود' : `موجودی: ${product.stock}`}
                    </p>

                    {errors.stock && (
                        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-joordak-foreground">
                            {errors.stock}
                        </div>
                    )}

                    {auth.user ? (
                        cartQuantity > 0 ? (
                            <div className="mt-5 flex items-center justify-center gap-4">
                                <button
                                    type="button"
                                    onClick={() => updateQuantity(cartQuantity + 1)}
                                    disabled={hasReachedStock}
                                    className="flex h-10 w-10 items-center justify-center rounded-full bg-joordak text-joordak-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    +
                                </button>
                                <span className="text-lg font-bold text-joordak-accent">{cartQuantity}</span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (cartQuantity > 1) {
                                            updateQuantity(cartQuantity - 1);
                                        } else {
                                            removeFromCart();
                                        }
                                    }}
                                    className="flex h-10 w-10 items-center justify-center rounded-full bg-joordak text-joordak-foreground hover:opacity-90"
                                >
                                    -
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={addToCart}
                                disabled={isOutOfStock}
                                className="mt-5 w-full rounded-xl bg-joordak px-4 py-3 font-bold text-joordak-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                افزودن به سبد
                            </button>
                        )
                    ) : (
                        <Link href={route('login')} className="mt-5 block rounded-xl border border-stone-300 px-4 py-3 text-center font-semibold hover:border-stone-500">
                            برای خرید وارد شوید
                        </Link>
                    )}

                    <div className="mt-8 border-t border-joordak-border pt-6">
                        <h2 className="text-lg font-bold text-joordak-accent">توضیحات محصول</h2>
                        <p className="mt-3 whitespace-pre-line leading-8 text-joordak-foreground">
                            {product.description ?? product.excerpt ?? 'توضیحاتی برای این محصول ثبت نشده است.'}
                        </p>
                    </div>
                </section>
            </div>
        </StorefrontLayout>
    );
}
