import CartActionControls from '@/Components/CartActionControls';
import { useOptimisticCart } from '@/hooks/useOptimisticCart';
import { Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { PRODUCT_IMAGE_ASPECT_CLASS } from '@/constants/productImage';
import StorefrontLayout from '@/Layouts/StorefrontLayout';
import { loginUrl } from '@/lib/auth';

interface Product {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    description: string | null;
    is_active: boolean;
    price: string | number;
    stock: number;
    image_url: string | null;
    photo_urls: string[] | null;
    size: string | null;
    color_name: string | null;
    color_hex: string | null;
    sub_product_id: number | null;
    subproducts: SubProduct[];
    category?: { id: number; name: string; slug: string } | null;
}

interface SubProduct {
    id: number;
    price: string | number;
    discounted_price?: string | number;
    has_discount?: boolean;
    stock: number;
    size: string | null;
    color_name: string | null;
    color_hex: string | null;
    photo_urls: string[];
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

function uniqueValues(values: Array<string | null>): string[] {
    return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

interface EcommerceZoomProps {
    imageUrl: string | undefined;
    alt: string;
    imageClassName: string;
}

function EcommerceZoom({ imageUrl, alt, imageClassName }: EcommerceZoomProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isZoomed, setIsZoomed] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', closeOnEscape);

        return () => window.removeEventListener('keydown', closeOnEscape);
    }, [isOpen]);

    useEffect(() => {
        setIsZoomed(false);
    }, [imageUrl, isOpen]);

    if (!imageUrl) return null;

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="block w-full cursor-zoom-in border-0 bg-transparent p-0"
                aria-label="نمایش تصویر محصول در اندازه کامل"
            >
                <img src={imageUrl} alt={alt} loading="eager" decoding="async" fetchPriority="high" className={imageClassName} />
            </button>
            <span className="pointer-events-none absolute bottom-4 right-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-joordak-coral shadow">
                برای بزرگنمایی کلیک کنید
            </span>

            {isOpen && (
                <div
                    className="fixed inset-0 z-50 flex flex-col bg-black/90 p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-label="نمایشگر تصویر محصول"
                    onClick={() => setIsOpen(false)}
                >
                    <div className="mb-4 flex items-center justify-between gap-3 text-white">
                        <button
                            type="button"
                            onClick={(event) => {
                                event.stopPropagation();
                                setIsOpen(false);
                            }}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-2xl font-black leading-none text-white transition hover:bg-red-700"
                            aria-label="بستن"
                        >
                            ×
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            setIsZoomed((current) => !current);
                        }}
                        className="flex min-h-0 flex-1 cursor-zoom-in items-center justify-center overflow-auto border-0 bg-transparent p-0"
                        aria-label={isZoomed ? 'بازگشت تصویر به اندازه اصلی' : 'بزرگنمایی تصویر'}
                    >
                        <img
                            src={imageUrl}
                            alt={alt}
                            loading="eager"
                            decoding="async"
                            className={`max-h-full max-w-full object-contain transition-transform duration-200 ${isZoomed ? 'scale-150 cursor-zoom-out' : 'scale-100 cursor-zoom-in'}`}
                        />
                    </button>
                </div>
            )}
        </>
    );
}

export default function ProductShow({ product, galleryImages, cartItems }: ProductShowProps) {
    const { props, url } = usePage<{ auth: { user: any }, errors: Record<string, string> }>();
    const { auth, errors } = props;
    const {
        cartItems: optimisticCartItems,
        addToCart,
        increaseQuantity,
        decreaseQuantity,
        isPending,
    } = useOptimisticCart(cartItems);
    const initialSubProduct = product.subproducts[0];
    const [selectedSize, setSelectedSize] = useState<string | null>(initialSubProduct?.size ?? null);
    const [selectedColorName, setSelectedColorName] = useState<string | null>(initialSubProduct?.color_name ?? null);
    const [activeIndex, setActiveIndex] = useState(0);
    const sizeOptions = uniqueValues(product.subproducts.map((subProduct) => subProduct.size));
    const colorOptions = product.subproducts
        .filter((subProduct) => Boolean(subProduct.color_name))
        .filter((subProduct, index, allSubProducts) => (
            allSubProducts.findIndex((current) => current.color_name === subProduct.color_name) === index
        ));
    const selectedSubProduct = product.subproducts.find((subProduct) => (
        (!sizeOptions.length || subProduct.size === selectedSize)
        && (!colorOptions.length || subProduct.color_name === selectedColorName)
    )) ?? (
        sizeOptions.length || colorOptions.length ? null : product.subproducts[0]
    );

    const images = selectedSubProduct
        ? [product.image_url, ...selectedSubProduct.photo_urls].filter((image): image is string => Boolean(image))
        : galleryImages;
    const activeImage = images[activeIndex] ?? images[0];
    const cartItem = selectedSubProduct ? optimisticCartItems[selectedSubProduct.id] : undefined;
    const cartQuantity = cartItem?.quantity ?? 0;
    const selectedSubProductId = selectedSubProduct?.id ?? null;
    const isOutOfStock = !product.is_active || !selectedSubProduct || selectedSubProduct.stock <= 0;

    function selectSize(size: string) {
        setSelectedSize(size);
        setActiveIndex(0);
    }

    function selectColor(colorName: string) {
        setSelectedColorName(colorName);

        const colorHasSelectedSize = product.subproducts.some((subProduct) => (
            subProduct.color_name === colorName && (!selectedSize || subProduct.size === selectedSize)
        ));

        if (!colorHasSelectedSize) {
            const firstSizeForColor = product.subproducts.find((subProduct) => subProduct.color_name === colorName)?.size ?? null;
            setSelectedSize(firstSizeForColor);
        }

        setActiveIndex(0);
    }

    function isSizeAvailable(size: string): boolean {
        return !selectedColorName || product.subproducts.some((subProduct) => (
            subProduct.size === size && subProduct.color_name === selectedColorName
        ));
    }

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
            <Link href={route('products.index')} className="text-sm font-semibold text-joordak-coral hover:opacity-80">
                بازگشت به محصولات
            </Link>

            <div className="mt-6 grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
                <section className="space-y-4">
                    <div className="relative overflow-hidden rounded-3xl border border-[joordak-soft] bg-joordak-soft">
                        <EcommerceZoom
                            imageUrl={activeImage}
                            alt={product.title}
                            imageClassName={`${PRODUCT_IMAGE_ASPECT_CLASS} w-full object-cover`}
                        />

                        {images.length > 1 && (
                            <>
                                <button
                                    type="button"
                                    onClick={showNextImage}
                                    aria-label="تصویر بعدی"
                                    className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-xl font-bold text-joordak-coral shadow hover:bg-white"
                                >
                                    ›
                                </button>
                                <button
                                    type="button"
                                    onClick={showPreviousImage}
                                    aria-label="تصویر قبلی"
                                    className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-xl font-bold text-joordak-coral shadow hover:bg-white"
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
                                    <img src={image} alt={`${product.title} ${index + 1}`} loading="lazy" decoding="async" className={`${PRODUCT_IMAGE_ASPECT_CLASS} w-full object-cover`} />
                                </button>
                            ))}
                        </div>
                    )}
                </section>

                <section className="h-fit min-w-0 rounded-3xl border border-[joordak-soft] bg-white p-4 shadow-sm sm:p-6">
                    {product.category && (
                        <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">{product.category.name}</p>
                    )}
                    <h1 className="mt-2 text-3xl font-black text-joordak-coral">{product.title}</h1>
                    {product.excerpt && <p className="mt-3 text-stone-600">{product.excerpt}</p>}

                    <div className="mt-6 flex flex-col gap-2 rounded-2xl bg-joordak-soft p-4 sm:flex-row sm:items-center sm:justify-between">
                        <span className="shrink-0 text-sm text-stone-600">قیمت</span>
                        {selectedSubProduct?.has_discount && selectedSubProduct?.discounted_price != null ? (
                            <div className="flex min-w-0 flex-col gap-0.5">
                                <span className="text-xs text-stone-400 line-through sm:text-sm">
                                    <Price amount={selectedSubProduct.price} />
                                </span>
                                <span className="text-lg font-black text-rose-600 sm:text-xl md:text-2xl">
                                    <Price amount={selectedSubProduct.discounted_price} />
                                </span>
                            </div>
                        ) : (
                            <span className="text-lg font-black text-joordak-coral sm:text-xl md:text-2xl">
                                <Price amount={selectedSubProduct?.price ?? product.price} />
                            </span>
                        )}
                    </div>

                    <p className={`mt-4 text-sm font-semibold ${isOutOfStock ? 'text-red-600' : 'text-stone-600'}`}>
                        {isOutOfStock ? 'ناموجود' : `موجودی: ${selectedSubProduct?.stock}`}
                    </p>

                    {(sizeOptions.length > 0 || colorOptions.length > 0) && (
                        <div className="mt-4 rounded-2xl border border-[joordak-soft] p-4 text-sm text-stone-700">
                            {colorOptions.length > 0 && (
                                <div>
                                    <p className="mb-3 font-bold text-joordak-coral">رنگ</p>
                                    <div className="flex flex-wrap gap-2">
                                        {colorOptions.map((subProduct) => (
                                            <button
                                                key={subProduct.color_name}
                                                type="button"
                                                onClick={() => selectColor(subProduct.color_name!)}
                                                className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold transition ${
                                                    selectedColorName === subProduct.color_name
                                                        ? 'border-joordak bg-joordak-soft text-joordak-coral'
                                                        : 'border-stone-200 text-stone-600 hover:border-joordak'
                                                }`}
                                            >
                                                {subProduct.color_hex && <span className="h-4 w-4 rounded border border-stone-200" style={{ backgroundColor: subProduct.color_hex }} />}
                                                <span>{subProduct.color_name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {sizeOptions.length > 0 && (
                                <div className={colorOptions.length > 0 ? 'mt-4 border-t border-[joordak-soft] pt-4' : ''}>
                                    <p className="mb-3 font-bold text-joordak-coral">سایز</p>
                                    <div className="flex flex-wrap gap-2">
                                        {sizeOptions.map((size) => {
                                            const isAvailable = isSizeAvailable(size);

                                            return (
                                                <button
                                                    key={size}
                                                    type="button"
                                                    onClick={() => selectSize(size)}
                                                    disabled={!isAvailable}
                                                    className={`rounded-full border px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                                                        selectedSize === size
                                                            ? 'border-joordak bg-joordak-soft text-joordak-coral'
                                                            : 'border-stone-200 text-stone-600 hover:border-joordak'
                                                    }`}
                                                >
                                                    {size}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {errors.stock && (
                        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                            {errors.stock}
                        </div>
                    )}

                    {auth.user ? (
                        cartQuantity > 0 ? (
                            <div className="mt-5">
                                <CartActionControls
                                    quantity={cartQuantity}
                                    stock={selectedSubProduct?.stock ?? 0}
                                    isActive={product.is_active}
                                    disabled={isPending(selectedSubProductId)}
                                    variant="large"
                                    onIncrease={() => increaseQuantity(selectedSubProductId)}
                                    onDecrease={() => decreaseQuantity(selectedSubProductId)}
                                />
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => addToCart(selectedSubProductId)}
                                disabled={isOutOfStock || isPending(selectedSubProductId)}
                                className="mt-5 w-full rounded-full bg-joordak px-4 py-3 font-bold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                افزودن به سبد
                            </button>
                        )
                    ) : (
                        <Link href={loginUrl(url)} className="mt-5 block rounded-full border border-stone-300 px-4 py-3 text-center font-semibold hover:border-stone-500">
                            برای خرید وارد شوید
                        </Link>
                    )}

                    <div className="mt-8 border-t border-[joordak-soft] pt-6">
                        <h2 className="text-lg font-bold text-joordak-coral">توضیحات محصول</h2>
                        <p className="mt-3 whitespace-pre-line leading-8 text-stone-700">
                            {product.description ?? product.excerpt ?? 'توضیحاتی برای این محصول ثبت نشده است.'}
                        </p>
                    </div>
                </section>
            </div>

        </StorefrontLayout>
    );
}
