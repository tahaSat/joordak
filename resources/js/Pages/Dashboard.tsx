import StorefrontLayout from '@/Layouts/StorefrontLayout';
import { Link } from '@inertiajs/react';

interface InvoiceItem {
    id: number;
    product_name: string;
    unit_price: number;
    quantity: number;
    line_total: number;
}

interface Invoice {
    id: number;
    total: number;
    status: string;
    payment_reference: string | null;
    paid_at: string | null;
    created_at: string;
    items: InvoiceItem[];
}

interface DashboardProps {
    invoices: Invoice[];
}

function Price({ amount }: { amount: number }) {
    return <span>﷼{Math.round(Number(amount)).toLocaleString()}</span>;
}

export default function Dashboard({ invoices }: DashboardProps) {
    return (
        <StorefrontLayout title="حساب کاربری" seo={{ noIndex: true }}>
            <div dir="rtl" className="py-8 sm:py-12">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-8">
                        <p className="text-sm font-semibold text-joordak-accent">پنل کاربری</p>
                        <h1 className="mt-2 text-3xl font-black text-joordak-foreground">حساب کاربری</h1>
                        <p className="mt-3 max-w-2xl text-sm leading-7 text-joordak-foreground">
                            از این بخش می‌توانید اطلاعات حساب، سبد خرید و سفارش‌های خود را مدیریت کنید.
                        </p>
                    </div>

                    <div className="flex flex-col gap-6">
                        <div className="grid gap-4 md:grid-cols-3">
                            <Link
                                href={route('profile.edit')}
                                className="block rounded-2xl border border-joordak-border bg-white p-6 text-right shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                            >
                                <h2 className="text-lg font-bold text-joordak-accent">ویرایش پروفایل</h2>
                                <p className="mt-2 text-sm leading-6 text-joordak-foreground">اطلاعات شخصی، شماره تماس و آدرس خود را به‌روز کنید.</p>
                            </Link>
                            <Link
                                href={route('cart.index')}
                                className="block rounded-2xl border border-joordak-border bg-white p-6 text-right shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                            >
                                <h2 className="text-lg font-bold text-joordak-accent">سبد خرید</h2>
                                <p className="mt-2 text-sm leading-6 text-joordak-foreground">محصولات انتخاب‌شده را بررسی و برای پرداخت آماده کنید.</p>
                            </Link>
                            <Link
                                href={route('products.index')}
                                className="block rounded-2xl border border-joordak-border bg-white p-6 text-right shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                            >
                                <h2 className="text-lg font-bold text-joordak-accent">مشاهده محصولات</h2>
                                <p className="mt-2 text-sm leading-6 text-joordak-foreground">جدیدترین محصولات فروشگاه را ببینید و خرید خود را ادامه دهید.</p>
                            </Link>
                        </div>

                        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
                                <h2 className="text-lg font-bold text-joordak-foreground">تاریخچه سفارش‌ها</h2>
                            </div>
                            <div className="p-5 sm:p-6">
                                {invoices.length === 0 ? (
                                    <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                                        <p className="text-joordak-foreground">هنوز سفارشی ثبت نکرده‌اید.</p>
                                        <Link
                                            href={route('products.index')}
                                            className="mt-4 inline-flex rounded-full bg-joordak px-5 py-2.5 text-sm font-semibold text-joordak-foreground transition hover:bg-joordak-dark"
                                        >
                                            شروع خرید
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-4">
                                        {invoices.map((invoice) => (
                                            <article key={invoice.id} className="rounded-xl border border-slate-200 p-4">
                                                <div className="flex flex-wrap items-center justify-between gap-4">
                                                    <div>
                                                        <p className="font-semibold text-joordak-foreground">سفارش #{invoice.id}</p>
                                                        <p className="mt-1 text-sm text-joordak-foreground">
                                                            {new Date(invoice.created_at).toLocaleDateString('fa-IR')}
                                                        </p>
                                                    </div>
                                                    <div className="text-left sm:text-right">
                                                        <p className="text-lg font-bold text-joordak-accent">
                                                            <Price amount={invoice.total} />
                                                        </p>
                                                        <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold text-joordak-foreground ${invoice.status === 'paid' ? 'bg-green-100' : 'bg-yellow-100'}`}>
                                                            {invoice.status === 'paid' ? 'پرداخت شده' : 'در انتظار پرداخت'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="mt-4 border-t border-slate-100 pt-4">
                                                    <p className="text-sm font-semibold text-joordak-foreground">محصولات:</p>
                                                    <ul className="mt-2 flex flex-col gap-2">
                                                        {invoice.items.map((item) => (
                                                            <li key={item.id} className="flex justify-between gap-4 text-sm text-joordak-foreground">
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
