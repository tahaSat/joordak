import { Link, router, useForm, usePage } from '@inertiajs/react';
import type { PageProps } from '@/types';
import { FormEvent, useState } from 'react';
import StorefrontLayout from '@/Layouts/StorefrontLayout';

interface CartItem {
    id: number;
    product?: {
        title: string;
    } | null;
    sub_product?: {
        size: string | null;
        color_name: string | null;
        color_hex: string | null;
        stock: number;
    } | null;
    unit_price: number;
    original_unit_price: number;
    discount_amount: number;
    quantity: number;
    line_total: number;
    line_original_total: number;
}

interface CartSummary {
    gross_subtotal: number;
    product_discount_total: number;
    subtotal: number;
    invoice_discount_amount: number;
    total: number;
}

interface AppliedCoupon {
    code: string;
    amount: number;
}

interface CartIndexProps {
    items: CartItem[];
    summary: CartSummary;
    appliedCoupon: AppliedCoupon | null;
}

function Price({ amount }: { amount: string | number }) {
    return <span>﷼{Math.round(Number(amount)).toLocaleString()}</span>;
}

export default function CartIndex({ items, summary, appliedCoupon }: CartIndexProps) {
    const { auth, errors, flash } = usePage<PageProps<{ errors: Record<string, string> }>>().props;
    const couponForm = useForm({ code: '' });
    const [copied, setCopied] = useState(false);
    const isAdmin = auth.user?.role === 'admin';
    const sharedCartUrl = flash?.shared_cart_url ?? null;

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

    const shareCart = () => {
        router.post(route('admin.shared-carts.store'), {}, { preserveScroll: true });
    };

    const copySharedCartUrl = async () => {
        if (!sharedCartUrl) {
            return;
        }

        await navigator.clipboard.writeText(sharedCartUrl);
        setCopied(true);
    };

    const applyCoupon = (event: FormEvent) => {
        event.preventDefault();
        couponForm.post(route('cart.coupon.store'), {
            preserveScroll: true,
            onSuccess: () => couponForm.reset('code'),
        });
    };

    const removeCoupon = () => {
        router.delete(route('cart.coupon.destroy'), { preserveScroll: true });
    };

    return (
        <StorefrontLayout title="سبد خرید" seo={{ noIndex: true }}>
            <h1 className="text-3xl font-black">سبد خرید</h1>

            {errors.stock && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                    {errors.stock}
                </div>
            )}

            {errors.address_province && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                    {errors.address_province}{' '}
                    <Link href={route('profile.edit')} className="font-bold underline">
                        تکمیل پروفایل
                    </Link>
                </div>
            )}

            {errors.shared_cart && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                    {errors.shared_cart}
                </div>
            )}

            {sharedCartUrl && (
                <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
                    <p className="font-bold">لینک سبد خرید آماده است.</p>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                        <input
                            value={sharedCartUrl}
                            readOnly
                            dir="ltr"
                            className="w-full rounded-md border-sky-200 bg-white text-left text-xs"
                        />
                        <button
                            type="button"
                            onClick={copySharedCartUrl}
                            className="shrink-0 rounded-full bg-sky-700 px-4 py-2 font-bold text-white hover:bg-sky-800"
                        >
                            {copied ? 'کپی شد' : 'کپی لینک'}
                        </button>
                    </div>
                </div>
            )}

            {items.length === 0 ? (
                <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '48px', textAlign: 'center', marginTop: '24px' }}>
                    <p style={{ color: '#6b7280', fontSize: '18px' }}>سبد خرید شما خالی است.</p>
                    <Link
                        href={route('products.index')}
                        style={{ display: 'inline-block', marginTop: '16px', backgroundColor: 'joordak-coral', color: 'white', padding: '12px 24px', borderRadius: '9999px', textDecoration: 'none', fontWeight: '500' }}
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
                                        {(item.sub_product?.size || item.sub_product?.color_name || item.sub_product?.color_hex) && (
                                            <p className="mt-1 inline-flex items-center gap-2 text-xs text-stone-500">
                                                {item.sub_product.size && <span>سایز: {item.sub_product.size}</span>}
                                                {(item.sub_product.color_name || item.sub_product.color_hex) && (
                                                    <span className="inline-flex items-center gap-1">
                                                        {item.sub_product.color_hex && <span className="h-3 w-3 rounded border border-stone-200" style={{ backgroundColor: item.sub_product.color_hex }} />}
                                                        {item.sub_product.color_name ?? item.sub_product.color_hex}
                                                    </span>
                                                )}
                                            </p>
                                        )}
                                        <p className="mt-1 text-sm text-stone-600">
                                            قیمت واحد:{' '}
                                            {item.discount_amount > 0 ? (
                                                <span className="inline-flex items-center gap-2">
                                                    <span className="text-stone-400 line-through"><Price amount={item.original_unit_price} /></span>
                                                    <span className="font-semibold text-rose-600"><Price amount={item.unit_price} /></span>
                                                </span>
                                            ) : (
                                                <Price amount={item.unit_price} />
                                            )}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeItem(item.id)}
                                        className="text-sm text-red-600 hover:text-red-800"
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

                        <div className="mt-3 space-y-2 text-sm">
                            <p className="flex items-center justify-between">
                                <span className="text-stone-600">جمع کالاها</span>
                                <span><Price amount={summary.gross_subtotal} /></span>
                            </p>
                            {summary.product_discount_total > 0 && (
                                <p className="flex items-center justify-between text-rose-600">
                                    <span>تخفیف محصولات</span>
                                    <span>- <Price amount={summary.product_discount_total} /></span>
                                </p>
                            )}
                            {summary.invoice_discount_amount > 0 && (
                                <p className="flex items-center justify-between text-rose-600">
                                    <span>کد تخفیف{appliedCoupon ? ` (${appliedCoupon.code})` : ''}</span>
                                    <span>- <Price amount={summary.invoice_discount_amount} /></span>
                                </p>
                            )}
                        </div>

                        <div className="mt-4 border-t border-stone-200 pt-3">
                            <form onSubmit={applyCoupon} className="space-y-2">
                                <label htmlFor="coupon" className="text-sm font-medium text-stone-700">کد تخفیف</label>
                                {appliedCoupon ? (
                                    <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm">
                                        <span className="font-semibold text-emerald-700">{appliedCoupon.code}</span>
                                        <button type="button" onClick={removeCoupon} className="text-xs font-bold text-red-600 hover:text-red-800">حذف</button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <input
                                            id="coupon"
                                            value={couponForm.data.code}
                                            onChange={(event) => couponForm.setData('code', event.target.value)}
                                            placeholder="کد تخفیف را وارد کنید"
                                            className="w-full rounded-md border-stone-300 text-sm"
                                            dir="ltr"
                                        />
                                        <button
                                            type="submit"
                                            disabled={couponForm.processing}
                                            className="shrink-0 rounded-full bg-stone-900 px-4 text-sm font-bold text-white hover:bg-stone-700 disabled:opacity-60"
                                        >
                                            اعمال
                                        </button>
                                    </div>
                                )}
                                {errors.code && <p className="text-xs text-red-600">{errors.code}</p>}
                            </form>
                        </div>

                        <p className="mt-4 flex items-center justify-between border-t border-stone-200 pt-3 text-sm">
                            <span>قیمت کل</span>
                            <span className="text-xl font-bold text-sky-700"><Price amount={summary.total} /></span>
                        </p>
                        <button
                            type="button"
                            onClick={checkout}
                            className="mt-4 w-full rounded-full bg-stone-900 px-4 py-2 text-white hover:bg-stone-700"
                        >
                            تکمیل خرید
                        </button>
                        {isAdmin && (
                            <button
                                type="button"
                                onClick={shareCart}
                                className="mt-2 w-full rounded-full border border-sky-700 px-4 py-2 font-bold text-sky-800 hover:bg-sky-50"
                            >
                                ساخت لینک اشتراک سبد خرید
                            </button>
                        )}
                    </aside>
                </div>
            )}
        </StorefrontLayout>
    );
}
