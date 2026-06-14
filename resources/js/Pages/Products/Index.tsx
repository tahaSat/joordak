import { router, usePage } from '@inertiajs/react';
import ProductCard from '@/Components/ProductCard';
import { useOptimisticCart } from '@/hooks/useOptimisticCart';
import StorefrontLayout from '@/Layouts/StorefrontLayout';
import { useEffect, useRef, useState } from 'react';

interface Product {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    price: string;
    image_url: string | null;
    size: string | null;
    color_name: string | null;
    color_hex: string | null;
    size_count: number;
    color_count: number;
    sub_product_id: number | null;
    is_active?: boolean;
    stock: number;
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
    current_page: number;
    next_page_url: string | null;
}

interface ProductsIndexProps {
    products: ProductsPaginationData;
    categories: Category[];
    cartItems: Record<number, { quantity: number; cart_item_id: number }>;
    selectedCategory?: Category | null;
    showDiscountedOnly?: boolean;
}

export default function ProductsIndex({ products, categories, cartItems, selectedCategory, showDiscountedOnly = false }: ProductsIndexProps) {
    const { auth, errors } = usePage<{ auth: { user: any }, errors: Record<string, string> }>().props;
    const {
        cartItems: optimisticCartItems,
        addToCart,
        increaseQuantity,
        decreaseQuantity,
        isPending,
    } = useOptimisticCart(cartItems);
    const [productList, setProductList] = useState(products.data);
    const [nextPageUrl, setNextPageUrl] = useState(products.next_page_url);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);
    const pageTitle = showDiscountedOnly
        ? 'محصولات با تخفیف'
        : selectedCategory
            ? selectedCategory.name
            : 'همه‌ی محصولات';
    const pageDescription = showDiscountedOnly
        ? 'خرید محصولات با تخفیف از فروشگاه آنلاین Joordak.'
        : selectedCategory
            ? `خرید ${selectedCategory.name} از فروشگاه آنلاین Joordak.`
            : 'خرید پیرسینگ، گردنبند، انگشتر و زیورآلات از فروشگاه آنلاین Joordak.';

    const filterAll = () => {
        router.get(route('products.index'), {}, { preserveScroll: false });
    };

    const filterDiscounted = () => {
        router.get(route('products.index'), { discounted: 1 }, { preserveScroll: false });
    };

    const filterByCategory = (categorySlug: string) => {
        router.get(route('products.index'), { category: categorySlug }, { preserveScroll: false });
    };

    useEffect(() => {
        setProductList(products.data);
        setNextPageUrl(products.next_page_url);
    }, [selectedCategory?.id, showDiscountedOnly]);

    useEffect(() => {
        const sentinel = loadMoreRef.current;

        if (!sentinel || !nextPageUrl || isLoadingMore) {
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting || isLoadingMore || !nextPageUrl) {
                    return;
                }

                setIsLoadingMore(true);
                router.get(nextPageUrl, {}, {
                    preserveScroll: true,
                    preserveState: true,
                    only: ['products'],
                    onSuccess: (page) => {
                        const nextProducts = page.props.products as ProductsPaginationData;

                        setProductList((currentProducts) => [
                            ...currentProducts,
                            ...nextProducts.data.filter(
                                (product) => !currentProducts.some((currentProduct) => currentProduct.id === product.id),
                            ),
                        ]);
                        setNextPageUrl(nextProducts.next_page_url);
                    },
                    onFinish: () => setIsLoadingMore(false),
                });
            },
            { rootMargin: '300px' },
        );

        observer.observe(sentinel);

        return () => observer.disconnect();
    }, [isLoadingMore, nextPageUrl]);

    return (
        <StorefrontLayout title={pageTitle} seo={{ description: pageDescription }}>
            <h1 className="text-3xl font-black">
                {showDiscountedOnly ? (
                    <>
                        محصولات با تخفیف{' '}
                    </>
                ) : selectedCategory ? (
                    selectedCategory.name
                ) : (
                    'همه‌ی محصولات'
                )}
            </h1>
            <p className="mt-2 text-stone-600">محصولات مورد نظر خود را به سبد خرید اضافه کنید </p>

            {errors.stock && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                    {errors.stock}
                </div>
            )}

            {categories.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={filterAll}
                        className={`rounded-full border px-4 py-1.5 text-sm ${
                            !selectedCategory && !showDiscountedOnly
                                ? 'border-joordak bg-joordak text-white'
                                : 'border-[joordak-soft] text-joordak-coral hover:bg-joordak-soft'
                        }`}
                    >
                        همه
                    </button>
                    <button
                        type="button"
                        onClick={filterDiscounted}
                        className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${
                            showDiscountedOnly
                                ? 'border-red-600 bg-red-600 text-white'
                                : 'border-red-600 text-red-600 hover:bg-red-50'
                        }`}
                    >
                        با تخفیف ٪‌
                    </button>
                    {categories.map((category) => (
                        <button
                            key={category.id}
                            type="button"
                            onClick={() => filterByCategory(category.slug)}
                            className={`rounded-full border px-4 py-1.5 text-sm ${
                                selectedCategory?.id === category.id && !showDiscountedOnly
                                    ? 'border-joordak bg-joordak text-white'
                                    : 'border-[joordak-soft] text-joordak-coral hover:bg-joordak-soft'
                            }`}
                        >
                            {category.name}
                        </button>
                    ))}
                </div>
            )}

            <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
                {productList.map((product) => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        cartItems={optimisticCartItems}
                        isAuthenticated={Boolean(auth.user)}
                        onAddToCart={addToCart}
                        onIncreaseQuantity={increaseQuantity}
                        onDecreaseQuantity={decreaseQuantity}
                        isCartActionPending={isPending}
                    />
                ))}
            </div>

            <div ref={loadMoreRef} className="h-10" />

            {isLoadingMore && (
                <p className="mt-2 text-center text-sm text-stone-500">در حال بارگذاری محصولات بیشتر...</p>
            )}
        </StorefrontLayout>
    );
}
