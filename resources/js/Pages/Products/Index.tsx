import { Link, router, usePage } from '@inertiajs/react';
import { PRODUCT_IMAGE_ASPECT_CLASS } from '@/constants/productImage';
import StorefrontLayout from '@/Layouts/StorefrontLayout';

interface Product {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    price: string;
    image_url: string | null;
    category_id: number | null;
    category?: { id: number; name: string; slug: string } | null;
}

interface Category {
    id: number;
    name: string;
    slug: string;
}

interface ProductsPaginationData {
    data: Product[];
    [key: string]: any;
}

interface PriceProps {
    amount: string | number;
}

function Price({ amount }: PriceProps) {
    return <span>﷼{Math.round(Number(amount)).toLocaleString()}</span>;
}

interface ProductsIndexProps {
    products: ProductsPaginationData;
    categories: Category[];
    cartItems: Record<number, { quantity: number; cart_item_id: number }>;
    selectedCategory?: Category | null;
}

export default function ProductsIndex({ products, categories, cartItems, selectedCategory }: ProductsIndexProps) {
    const { auth, errors } = usePage<{ auth: { user: any }, errors: Record<string, string> }>().props;
    const pageTitle = selectedCategory ? `محصولات ${selectedCategory.name}` : 'محصولات';
    const pageDescription = selectedCategory
        ? `خرید ${selectedCategory.name} از فروشگاه آنلاین جردک.`
        : 'خرید محصولات از فروشگاه آنلاین جردک — استایل خود را از بالا تا پایین بسازید.';

    const filterByCategory = (categorySlug: string | null) => {
        router.get(
            route('products.index'),
            categorySlug ? { category: categorySlug } : {},
            { preserveScroll: true }
        );
    };

    const addToCart = (productId: number) => {
        router.post(route('cart.store'), { product_id: productId, quantity: 1 }, {
            preserveScroll: true,
            onSuccess: () => {
                router.reload({ only: ['cartItems'] });
            },
            onError: () => {
                // Don't reload on error so errors are preserved
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
            },
            onError: () => {
                // Don't reload on error so errors are preserved
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
        <StorefrontLayout title={pageTitle} seo={{ description: pageDescription }}>
            <h1 className="text-3xl font-black">محصولات</h1>
            <p className="mt-2 text-joordak-foreground">محصولات مورد نظر خود را به سبد خرید اضافه کنید </p>

            {errors.stock && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-joordak-foreground">
                    {errors.stock}
                </div>
            )}

            {categories.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => filterByCategory(null)}
                        className={`rounded-full border px-4 py-1.5 text-sm ${
                            !selectedCategory
                                ? 'border-joordak bg-joordak text-joordak-foreground'
                                : 'border-joordak-border text-joordak-accent hover:bg-joordak-soft'
                        }`}
                    >
                        همه
                    </button>
                    {categories.map((category) => (
                        <button
                            key={category.id}
                            type="button"
                            onClick={() => filterByCategory(category.slug)}
                            className={`rounded-full border px-4 py-1.5 text-sm ${
                                selectedCategory?.id === category.id
                                    ? 'border-joordak bg-joordak text-joordak-foreground'
                                    : 'border-joordak-border text-joordak-accent hover:bg-joordak-soft'
                            }`}
                        >
                            {category.name}
                        </button>
                    ))}
                </div>
            )}

            <div className="mt-6 flex gap-4 overflow-x-auto pb-4 md:grid md:grid-cols-4 md:overflow-visible">
                {products.data.map((product) => (
                    <article key={product.id} className="flex-shrink-0 w-64 overflow-hidden rounded-xl border border-joordak-border bg-white md:w-auto">
                        <Link href={route('products.show', product.slug)} className="block">
                            <img
                                src={product.image_url ?? '/logo.svg'}
                                alt={product.title}
                                className={`${PRODUCT_IMAGE_ASPECT_CLASS} w-full object-cover`}
                            />
                        </Link>
                        <div className="p-3">
                        <Link href={route('products.show', product.slug)} className="block hover:opacity-80">
                            {product.category && (
                                <p className="text-xs uppercase tracking-wider text-joordak-foreground">{product.category.name}</p>
                            )}
                            <h2 className="text-sm font-semibold">{product.title}</h2>
                            <p className="mt-1 text-xs text-joordak-foreground">{product.excerpt ?? 'No summary yet.'}</p>
                        </Link>
                            <p className="mt-2 text-sm font-bold text-joordak-accent"><Price amount={product.price} /></p>

                        {auth.user ? (
                            cartItems[product.id]?.quantity ? (
                                <div className="mt-3 flex items-center justify-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => updateQuantity(product.id, cartItems[product.id].quantity + 1)}
                                        className="flex h-8 w-8 items-center justify-center rounded-full bg-joordak text-joordak-foreground hover:opacity-90"
                                    >
                                        +
                                    </button>
                                    <span className="text-sm font-bold text-joordak-accent">{cartItems[product.id].quantity}</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (cartItems[product.id].quantity > 1) {
                                                updateQuantity(product.id, cartItems[product.id].quantity - 1);
                                            } else {
                                                removeFromCart(product.id);
                                            }
                                        }}
                                        className="flex h-8 w-8 items-center justify-center rounded-full bg-joordak text-joordak-foreground hover:opacity-90"
                                    >
                                        -
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => addToCart(product.id)}
                                    className="mt-3 w-full rounded-lg bg-joordak px-3 py-1.5 text-xs text-joordak-foreground hover:opacity-90"
                                >
                                    افزودن به سبد
                                </button>
                            )
                        ) : (
                            <Link href={route('login')} className="mt-4 block rounded-lg border border-stone-300 px-4 py-2 text-center text-sm hover:border-stone-500">
                                برای خرید وارد شوید
                            </Link>
                        )}
                        </div>
                    </article>
                ))}
            </div>
        </StorefrontLayout>
    );
}
