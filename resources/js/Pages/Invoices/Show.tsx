import Modal from '@/Components/Modal';
import StorefrontLayout from '@/Layouts/StorefrontLayout';
import { invoiceCanBePaid, invoiceStatusClassStorefront, invoiceStatusLabel } from '@/lib/format';
import type { PageProps } from '@/types';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import { FormEvent, useEffect, useState } from 'react';

interface InvoiceItem {
    id: number;
    product_name: string;
    unit_price: number;
    original_unit_price: number;
    product_discount_amount: number;
    quantity: number;
    line_total: number;
}

interface Payment {
    id: number;
    status: string;
    gateway_track_id: string | null;
    gateway_ref_number: string | null;
    failure_message: string | null;
}

interface Invoice {
    id: number;
    total: number;
    subtotal: number;
    shipping_cost: number;
    address: string | null;
    postal_code: string | null;
    discount_code: string | null;
    invoice_discount_amount: number;
    status: string;
    payment_reference: string | null;
    post_tracking_code: string | null;
    paid_at: string | null;
    items: InvoiceItem[];
    latest_payment: Payment | null;
}

function Price({ amount }: { amount: number }) {
    return <span>﷼{Math.round(Number(amount)).toLocaleString()}</span>;
}

function getPaymentStatusLabel(status: string): string {
    const statusMap: Record<string, string> = {
        pending: 'در انتظار شروع',
        processing: 'در حال پردازش',
        paid: 'پرداخت شده',
        failed: 'ناموفق',
        cancelled: 'لغو شده',
        expired: 'منقضی شده',
    };

    return statusMap[status] ?? invoiceStatusLabel(status);
}

export default function InvoiceShow({ invoice }: { invoice: Invoice }) {
    const { flash, errors } = usePage<PageProps & { errors: Record<string, string> }>().props;
    const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
    const latestPayment = invoice.latest_payment;
    const isPaid = invoice.status === 'paid' || latestPayment?.status === 'paid';
    const canPay = invoiceCanBePaid(invoice.status) && !isPaid;
    const couponForm = useForm({ code: '' });
    const productDiscountTotal = invoice.items.reduce((sum, item) => sum + (item.product_discount_amount ?? 0), 0);
    const grossSubtotal = invoice.subtotal + productDiscountTotal;

    const applyCoupon = (event: FormEvent) => {
        event.preventDefault();
        couponForm.post(route('invoices.discount.store', invoice.id), {
            preserveScroll: true,
            onSuccess: () => couponForm.reset('code'),
        });
    };

    const removeCoupon = () => {
        router.delete(route('invoices.discount.destroy', invoice.id), { preserveScroll: true });
    };

    useEffect(() => {
        if (flash?.success && flash?.payment_track_id) {
            setShowPaymentSuccess(true);
        }
    }, [flash?.success, flash?.payment_track_id]);

    return (
        <StorefrontLayout title={`فاکتور #${invoice.id}`} seo={{ noIndex: true }}>
            <Modal show={showPaymentSuccess} onClose={() => setShowPaymentSuccess(false)} maxWidth="md">
                <div className="p-6 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700">
                        ✓
                    </div>
                    <h2 className="mt-4 text-xl font-black text-slate-900">پرداخت با موفقیت انجام شد</h2>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{flash?.success}</p>
                    {flash?.payment_track_id && (
                        <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                            <p className="text-sm text-emerald-700">کد پیگیری پرداخت</p>
                            <p className="mt-1 text-lg font-black text-emerald-900">{flash.payment_track_id}</p>
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={() => setShowPaymentSuccess(false)}
                        className="mt-6 rounded-full bg-joordak px-6 py-2.5 font-semibold text-white transition hover:bg-[#17495f]"
                    >
                        متوجه شدم
                    </button>
                </div>
            </Modal>
            <h1 className="text-3xl font-black">فاکتور #{invoice.id}</h1>
            <p className="mt-2 text-stone-600">
                وضعیت:{' '}
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${invoiceStatusClassStorefront(invoice.status)}`}>
                    {invoiceStatusLabel(invoice.status)}
                </span>
            </p>
            <p className="mt-2 text-sm text-stone-600">
                <span className="font-medium text-stone-800">آدرس: </span>
                {invoice.address ?? '—'}
            </p>
            <p className="mt-2 text-sm text-stone-600">
                <span className="font-medium text-stone-800">کد پستی: </span>
                {invoice.postal_code ?? '—'}
            </p>

            <div className="mt-6 rounded-xl border border-stone-200 bg-white p-5">
                <h2 className="text-lg font-semibold">اقلام</h2>
                <div className="mt-4 divide-y divide-stone-200">
                    {invoice.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between py-3 text-sm">
                            <div>
                                <p className="font-medium">{item.product_name}</p>
                                <p className="text-stone-500">
                                    {item.quantity} x{' '}
                                    {item.product_discount_amount > 0 ? (
                                        <span className="inline-flex items-center gap-1">
                                            <span className="text-stone-400 line-through"><Price amount={item.original_unit_price} /></span>
                                            <span className="text-rose-600"><Price amount={item.unit_price} /></span>
                                        </span>
                                    ) : (
                                        <Price amount={item.unit_price} />
                                    )}
                                </p>
                            </div>
                            <p className="font-semibold"><Price amount={item.line_total} /></p>
                        </div>
                    ))}
                </div>

                <div className="mt-4 space-y-2 border-t border-stone-200 pt-4 text-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-stone-600">جمع کالاها</span>
                        <span><Price amount={grossSubtotal} /></span>
                    </div>
                    {productDiscountTotal > 0 && (
                        <div className="flex items-center justify-between text-rose-600">
                            <span>تخفیف محصولات</span>
                            <span>- <Price amount={productDiscountTotal} /></span>
                        </div>
                    )}
                    {invoice.invoice_discount_amount > 0 && (
                        <div className="flex items-center justify-between text-rose-600">
                            <span>کد تخفیف{invoice.discount_code ? ` (${invoice.discount_code})` : ''}</span>
                            <span>- <Price amount={invoice.invoice_discount_amount} /></span>
                        </div>
                    )}
                    <div className="flex items-center justify-between">
                        <span className="text-stone-600">هزینه ی ارسال</span>
                        <span><Price amount={invoice.shipping_cost} /></span>
                    </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-stone-200 pt-4">
                    <p className="text-sm text-stone-600">مبلغ قابل پرداخت</p>
                    <p className="text-2xl font-black text-sky-700"><Price amount={invoice.total} /></p>
                </div>

                {canPay && (
                    <div className="mt-4 border-t border-stone-200 pt-4">
                        <form onSubmit={applyCoupon} className="space-y-2">
                            <label htmlFor="invoice-coupon" className="text-sm font-medium text-stone-700">کد تخفیف</label>
                            {invoice.discount_code ? (
                                <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm">
                                    <span className="font-semibold text-emerald-700">{invoice.discount_code}</span>
                                    <button type="button" onClick={removeCoupon} className="text-xs font-bold text-red-600 hover:text-red-800">حذف</button>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <input
                                        id="invoice-coupon"
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
                            {errors?.code && <p className="text-xs text-red-600">{errors.code}</p>}
                        </form>
                    </div>
                )}
            </div>

            <div className={`mt-6 rounded-xl border p-5 text-sm text-slate-700 ${isPaid ? 'border-emerald-100 bg-emerald-50' : 'border-sky-100 bg-sky-50'}`}>
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h2 className={`text-base font-bold ${isPaid ? 'text-emerald-900' : 'text-slate-900'}`}>پرداخت آنلاین با زیبال</h2>
                        <p className="mt-1">
                            {invoice.status === 'paid'
                                ? 'پرداخت این فاکتور با موفقیت تأیید شده است.'
                                : 'برای پرداخت از دکمه زیر استفاده کنید.'}
                        </p>
                    </div>

                    {canPay && (
                        <Link
                            href={route('invoices.pay', invoice.id)}
                            className="rounded-full bg-emerald-600 px-5 py-2.5 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            پرداخت
                        </Link>
                    )}
                </div>

                {latestPayment && (
                    <dl className="mt-4 grid gap-3 rounded-lg bg-white/70 p-4 sm:grid-cols-3">
                        <div>
                            <dt className="text-xs text-slate-500">وضعیت پرداخت</dt>
                            <dd className="mt-1 font-semibold">{getPaymentStatusLabel(latestPayment.status)}</dd>
                        </div>
                        {latestPayment.gateway_track_id && (
                            <div>
                                <dt className="text-xs text-slate-500">کد پیگیری زیبال</dt>
                                <dd className="mt-1 font-semibold">{latestPayment.gateway_track_id}</dd>
                            </div>
                        )}
                        {latestPayment.gateway_ref_number && (
                            <div>
                                <dt className="text-xs text-slate-500">شماره مرجع</dt>
                                <dd className="mt-1 font-semibold">{latestPayment.gateway_ref_number}</dd>
                            </div>
                        )}
                        {latestPayment.failure_message && (
                            <div className="sm:col-span-3">
                                <dt className="text-xs text-red-500">خطا</dt>
                                <dd className="mt-1 text-red-700">{latestPayment.failure_message}</dd>
                            </div>
                        )}
                    </dl>
                )}
            </div>

            <Link href={route('products.index')} className="mt-6 inline-block rounded-full bg-stone-900 px-4 py-2 text-white">
                ادامه خرید
            </Link>
        </StorefrontLayout>
    );
}
