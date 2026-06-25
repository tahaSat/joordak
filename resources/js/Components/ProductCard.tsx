import { SITE_LOGO_URL } from '@/Components/ApplicationLogo';
import CartActionControls from '@/Components/CartActionControls';
import { PRODUCT_CARD_IMAGE_ASPECT_CLASS } from '@/constants/productImage';
import { loginUrl } from '@/lib/auth';
import { formatNumberFa, formatPrice } from '@/lib/format';
import { Link, usePage } from '@inertiajs/react';

export interface ProductCardProduct {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    price: string | number;
    discounted_price?: string | number;
    has_discount?: boolean;
    is_active?: boolean;
    stock: number;
    image_url: string | null;
    size_count: number;
    color_count: number;
    sub_product_id: number | null;
    category?: { id: number; name: string; slug: string } | null;
}

interface ProductCardProps {
    product: ProductCardProduct;
    cartItems: Record<number, { quantity: number; cart_item_id: number }>;
    isAuthenticated: boolean;
    onAddToCart: (subProductId: number | null) => void;
    onIncreaseQuantity: (subProductId: number | null) => void;
    onDecreaseQuantity: (subProductId: number | null) => void;
    isCartActionPending?: (subProductId: number | null) => boolean;
    variant?: 'grid' | 'compact';
    showCategory?: boolean;
}

function Price({ amount }: { amount: string | number }) {
    return <span>{formatPrice(amount)}</span>;
}

export default function ProductCard({
    product,
    cartItems,
    isAuthenticated,
    onAddToCart,
    onIncreaseQuantity,
    onDecreaseQuantity,
    isCartActionPending = () => false,
    variant = 'grid',
    showCategory = false,
}: ProductCardProps) {
    const { url } = usePage();
    const isCompact = variant === 'compact';
    const cartItem = product.sub_product_id ? cartItems[product.sub_product_id] : undefined;

    const imageZoomClass = 'transition-transform duration-500 ease-in-out group-hover:scale-110 group-has-[:active]:scale-110';

    return (
        <article
            className={`group relative overflow-hidden border border-[joordak-soft] bg-white shadow-md shadow-slate-200/70 ${
                isCompact
                    ? 'w-[180px] shrink-0 rounded-2xl md:w-52 md:rounded-2xl'
                    : 'rounded-xl'
            }`}
        >
            <Link
                href={route('products.show', product.slug)}
                className="absolute inset-0 z-[1] rounded-[inherit]"
                aria-label={product.title}
            />

            <div className="relative z-[2] pointer-events-none">
                <div className="overflow-hidden">
                    {product.image_url ? (
                        <img
                            src={product.image_url}
                            alt={product.title}
                            loading="lazy"
                            decoding="async"
                            className={`${PRODUCT_CARD_IMAGE_ASPECT_CLASS} w-full object-cover ${imageZoomClass}`}
                        />
                    ) : isCompact ? (
                        <div className={`${PRODUCT_CARD_IMAGE_ASPECT_CLASS} w-full bg-gradient-to-br from-[joordak-soft] via-white to-[joordak-gradient] ${imageZoomClass}`} />
                    ) : (
                        <img
                            src={SITE_LOGO_URL}
                            alt={product.title}
                            loading="lazy"
                            decoding="async"
                            className={`${PRODUCT_CARD_IMAGE_ASPECT_CLASS} w-full object-cover ${imageZoomClass}`}
                        />
                    )}
                </div>

                <div className={isCompact ? 'p-2.5 md:p-3' : 'p-2.5 md:p-2'}>
                    {showCategory && product.category && (
                        <p className="text-xs uppercase tracking-wider text-stone-500">{product.category.name}</p>
                    )}
                    {isCompact ? (
                        <h3 className="truncate text-sm font-bold leading-snug">{product.title}</h3>
                    ) : (
                        <h2 className="truncate text-sm font-semibold leading-snug">{product.title}</h2>
                    )}

                    <div className={`mt-1 flex flex-wrap items-center text-stone-600 ${
                        isCompact
                            ? 'gap-1 text-[11px] md:text-xs'
                            : 'gap-1.5 text-[11px] md:text-xs'
                    }`}>
                        {product.size_count > 1 && (
                            <span className="rounded-full bg-joordak-soft px-1.5 py-0.5">
                                {formatNumberFa(product.size_count)} سایز
                            </span>
                        )}
                        {product.color_count > 1 && (
                            <span className="rounded-full bg-joordak-soft px-1.5 py-0.5">
                                {formatNumberFa(product.color_count)} رنگ
                            </span>
                        )}
                    </div>

                    {product.has_discount && product.discounted_price != null ? (
                        <div className={isCompact ? 'mt-1.5 md:mt-2' : 'mt-1.5 md:mt-1'}>
                            <p className="text-[11px] text-stone-400 line-through md:text-xs">
                                <Price amount={product.price} />
                            </p>
                            <p className={isCompact ? 'text-sm font-bold text-rose-600 md:text-base' : 'text-sm font-bold text-rose-600'}>
                                <Price amount={product.discounted_price} />
                            </p>
                        </div>
                    ) : (
                        <p className={isCompact ? 'mt-1.5 text-sm font-bold text-joordak-coral md:mt-2 md:text-base' : 'mt-1.5 text-sm font-bold text-joordak-coral md:mt-1'}>
                            <Price amount={product.price} />
                        </p>
                    )}

                    {isAuthenticated ? (
                        cartItem ? (
                            <div className={`pointer-events-auto ${isCompact ? 'mt-1.5 md:mt-2' : 'mt-2 md:mt-1.5'}`}>
                                <CartActionControls
                                    quantity={cartItem.quantity}
                                    stock={product.stock}
                                    isActive={product.is_active ?? true}
                                    disabled={isCartActionPending(product.sub_product_id)}
                                    variant={isCompact ? 'compact' : 'default'}
                                    onIncrease={() => onIncreaseQuantity(product.sub_product_id)}
                                    onDecrease={() => onDecreaseQuantity(product.sub_product_id)}
                                />
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => onAddToCart(product.sub_product_id)}
                                disabled={!product.sub_product_id}
                                className={`w-full cursor-pointer rounded-full border-none bg-joordak px-3 py-2 text-xs text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 pointer-events-auto ${
                                    isCompact ? 'mt-1.5 font-bold md:mt-2' : 'mt-2 md:mt-1.5'
                                }`}
                            >
                                افزودن به سبد
                            </button>
                        )
                    ) : (
                        <Link
                            href={loginUrl(url)}
                            className={`block rounded-full border text-center no-underline pointer-events-auto ${
                                isCompact
                                    ? 'mt-1.5 border-[#d6d6d6] px-3 py-2 text-[11px] md:mt-2 md:text-xs'
                                    : 'mt-2 border-stone-300 px-3 py-2 text-xs hover:border-stone-500 md:mt-1.5'
                            }`}
                        >
                            برای خرید وارد شوید
                        </Link>
                    )}
                </div>
            </div>
        </article>
    );
}
