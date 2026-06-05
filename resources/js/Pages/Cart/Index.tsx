import { Link, router, usePage } from '@inertiajs/react';
import { joordakColors } from '@/constants/theme';
import StorefrontLayout from '@/Layouts/StorefrontLayout';

interface CartItem {
    id: number;
    product?: {
        title: string;
    };
    unit_price: number;
    quantity: number;
}

interface CartIndexProps {
    items: CartItem[];
    total: number;
}

interface PriceProps {
    amount: string | number;
}

function Price({ amount }: PriceProps) {
    return <span>﷼{Math.round(Number(amount)).toLocaleString()}</span>;
}

export default function CartIndex({ items, total }: CartIndexProps) {
    const { errors } = usePage<{ errors: Record<string, string> }>().props;

    const updateQuantity = (itemId: number, quantity: number) => {
        router.patch(route('cart.update', itemId), { quantity }, {
            onError: () => {
                // Don't reload on error so errors are preserved
            }
        });
    };

    const removeItem = (itemId: number) => {
        router.delete(route('cart.destroy', itemId));
    };

    const checkout = () => {
        router.post(route('checkout.store'));
    };

    return (
        <StorefrontLayout title="سبد خرید" seo={{ noIndex: true }}>
            <h1 className="text-3xl font-black">سبد خرید</h1>

            {errors.stock && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-joordak-foreground">
                    {errors.stock}
                </div>
            )}

            {items.length === 0 ? (
                <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '48px', textAlign: 'center', marginTop: '24px' }}>
                    <p style={{ color: joordakColors.text, fontSize: '18px' }}>سبد خرید شما خالی است.</p>
                    <Link
                        href={route('products.index')}
                        style={{ display: 'inline-block', marginTop: '16px', backgroundColor: joordakColors.primary, color: joordakColors.foreground, padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: '500' }}
                    >
                        مشاهده محصولات
                    </Link>
                </div>
            ) : (
                <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
                    <div className="space-y-3">
                        {items.map((item) => (
                            <article key={item.id} className="rounded-xl border border-stone-200 bg-white p-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h2 className="font-semibold">{item.product?.title ?? 'محصول حذف شده'}</h2>
                                        <p className="mt-1 text-sm text-joordak-foreground">قیمت واحد: <Price amount={item.unit_price} /></p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeItem(item.id)}
                                        className="text-sm text-joordak-foreground hover:opacity-80"
                                    >
                                        حذف
                                    </button>
                                </div>
                                <div className="mt-4 flex items-center gap-3">
                                    <label htmlFor={`qty-${item.id}`} className="text-sm">تعداد</label>
                                    <input
                                        id={`qty-${item.id}`}
                                        type="number"
                                        min={1}
                                        max={20}
                                        defaultValue={item.quantity}
                                        className="w-24 rounded-md border-stone-300"
                                        onBlur={(event) => updateQuantity(item.id, Number(event.target.value || 1))}
                                    />
                                </div>
                            </article>
                        ))}
                    </div>

                    <aside className="h-fit rounded-xl border border-stone-200 bg-white p-5">
                        <h2 className="text-lg font-semibold">خلاصه</h2>
                        <p className="mt-3 flex items-center justify-between text-sm">
                            <span>جمع کل</span>
                            <span className="text-xl font-bold text-joordak-foreground"><Price amount={total} /></span>
                        </p>
                        <button
                            type="button"
                            onClick={checkout}
                            className="mt-4 w-full rounded-lg bg-stone-900 px-4 py-2 text-white hover:bg-stone-700"
                        >
                            تکمیل خرید
                        </button>
                        <p className="mt-3 text-xs text-joordak-foreground">فرآیند پرداخت برای ادغام بعدی شما خالی گذاشته شده است.</p>
                    </aside>
                </div>
            )}
        </StorefrontLayout>
    );
}
