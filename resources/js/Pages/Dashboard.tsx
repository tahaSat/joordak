import StorefrontLayout from '@/Layouts/StorefrontLayout';
import { invoiceCanBePaid, invoiceStatusClassStorefront, invoiceStatusLabel } from '@/lib/format';
import { Link } from '@inertiajs/react';

interface InvoiceItem {
    id: number;
    product_name: string;
    unit_price: number;
    quantity: number;
    line_total: number;
}

interface Payment {
    id: number;
    status: string;
    gateway_track_id: string | null;
    gateway_ref_number: string | null;
}

interface Invoice {
    id: number;
    total: number;
    status: string;
    payment_reference: string | null;
    post_tracking_code: string | null;
    paid_at: string | null;
    created_at: string;
    items: InvoiceItem[];
    latest_payment: Payment | null;
}

interface DashboardProps {
    invoices: Invoice[];
}

function Price({ amount }: { amount: number }) {
    return <span>﷼{Math.round(Number(amount)).toLocaleString()}</span>;
}

export default function Dashboard({ invoices }: DashboardProps) {
    const recentInvoices = invoices.slice(0, 3);

    return (
        <StorefrontLayout title="حساب کاربری" seo={{ noIndex: true }}>
            <div dir="rtl" className="py-8 sm:py-12">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-8">
                        <p className="text-sm font-semibold text-joordak-coral">پنل کاربری</p>
                        <h1 className="mt-2 text-3xl font-black text-slate-900">حساب کاربری</h1>
                        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                            از این بخش می‌توانید اطلاعات حساب، سبد خرید و سفارش‌های خود را مدیریت کنید.
                        </p>
                    </div>

                    <div className="flex flex-col gap-6">
                        <div className="grid gap-4 md:grid-cols-3">
                            <Link
                                href={route('profile.edit')}
                                className="block rounded-2xl border border-[joordak-soft] bg-white p-6 text-right shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                            >
                                <h2 className="text-lg font-bold text-joordak-coral">ویرایش پروفایل</h2>
                                <p className="mt-2 text-sm leading-6 text-slate-600">اطلاعات شخصی، شماره تماس و آدرس خود را به‌روز کنید.</p>
                            </Link>
                            <Link
                                href={route('cart.index')}
                                className="block rounded-2xl border border-[joordak-soft] bg-white p-6 text-right shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                            >
                                <h2 className="text-lg font-bold text-joordak-coral">سبد خرید</h2>
                                <p className="mt-2 text-sm leading-6 text-slate-600">محصولات انتخاب‌شده را بررسی و برای پرداخت آماده کنید.</p>
                            </Link>
                            <Link
                                href={route('products.index')}
                                className="block rounded-2xl border border-[joordak-soft] bg-white p-6 text-right shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                            >
                                <h2 className="text-lg font-bold text-joordak-coral">مشاهده محصولات</h2>
                                <p className="mt-2 text-sm leading-6 text-slate-600">جدیدترین محصولات فروشگاه را ببینید و خرید خود را ادامه دهید.</p>
                            </Link>
                        </div>

                        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:px-6">
                                <h2 className="text-lg font-bold text-slate-900">تاریخچه سفارش‌ها</h2>
                                <Link
                                    href={route('payment-history.index')}
                                    className="inline-flex rounded-full bg-joordak px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#17495f]"
                                >
                                    مشاهده بیشتر
                                </Link>
                            </div>
                            <div className="p-5 sm:p-6">
                                {invoices.length === 0 ? (
                                    <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                                        <p className="text-slate-600">هنوز سفارشی ثبت نکرده‌اید.</p>
                                        <Link
                                            href={route('products.index')}
                                            className="mt-4 inline-flex rounded-full bg-joordak px-6 py-3 font-medium text-white transition hover:bg-[#17495f]"
                                        >
                                            مشاهده محصولات
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-4">
                                        {recentInvoices.map((invoice) => (
                                            <article key={invoice.id} className="rounded-xl border border-slate-200 p-4">
                                                <div className="flex flex-wrap items-center justify-between gap-4">
                                                    <div>
                                                        <p className="font-semibold text-slate-900">سفارش #{invoice.id}</p>
                                                        <p className="mt-1 text-sm text-slate-500">
                                                            {new Date(invoice.created_at).toLocaleDateString('fa-IR')}
                                                        </p>
                                                    </div>
                                                    <div className="text-left sm:text-right">
                                                        <p className="text-lg font-bold text-joordak-coral">
                                                            <Price amount={invoice.total} />
                                                        </p>
                                                        <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold ${invoiceStatusClassStorefront(invoice.status)}`}>
                                                            {invoiceStatusLabel(invoice.status)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="mt-4 flex flex-wrap items-center gap-2">
                                                    <Link
                                                        href={route('invoices.show', invoice.id)}
                                                        className="inline-flex rounded-full border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-slate-50"
                                                    >
                                                        مشاهده فاکتور
                                                    </Link>
                                                    {invoiceCanBePaid(invoice.status) && (
                                                        <Link
                                                            href={route('invoices.pay', invoice.id)}
                                                            className="inline-flex rounded-full bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                                                        >
                                                            پرداخت
                                                        </Link>
                                                    )}
                                                    {invoice.latest_payment?.gateway_track_id && (
                                                        <span className="text-xs text-slate-500">کد پیگیری: {invoice.latest_payment.gateway_track_id}</span>
                                                    )}
                                                </div>
                                                <div className="mt-4 border-t border-slate-100 pt-4">
                                                    <p className="text-sm font-semibold text-slate-700">محصولات:</p>
                                                    <ul className="mt-2 flex flex-col gap-2">
                                                        {invoice.items.map((item) => (
                                                            <li key={item.id} className="flex justify-between gap-4 text-sm text-slate-600">
                                                                <span>{item.product_name} × {item.quantity}</span>
                                                                <span className="shrink-0"><Price amount={item.line_total} /></span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </StorefrontLayout>
    );
}
