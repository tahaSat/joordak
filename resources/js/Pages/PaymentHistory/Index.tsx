import AdminPagination from '@/Components/Admin/AdminPagination';
import StorefrontLayout from '@/Layouts/StorefrontLayout';
import { invoiceCanBePaid, invoiceStatusClassStorefront, invoiceStatusLabel } from '@/lib/format';
import type { Paginated } from '@/types/admin';
import { Head, Link, router } from '@inertiajs/react';

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

interface PaymentHistoryProps {
    invoices: Paginated<Invoice>;
    filters: {
        pending_only: boolean;
    };
}

function Price({ amount }: { amount: number }) {
    return <span>﷼{Math.round(Number(amount)).toLocaleString()}</span>;
}

export default function PaymentHistory({ invoices, filters }: PaymentHistoryProps) {
    const togglePendingOnly = (checked: boolean) => {
        router.get(
            route('payment-history.index'),
            { pending_only: checked ? 1 : undefined, page: 1 },
            { preserveState: true, preserveScroll: true },
        );
    };

    return (
        <StorefrontLayout title="پرداخت ها" seo={{ noIndex: true }}>
            <Head title="پرداخت ها" />

            <div style={{ padding: '48px 0' }}>
                <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <h1 className="text-3xl font-black">پرداخت ها</h1>
                        <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
                            <input
                                type="checkbox"
                                checked={filters.pending_only}
                                onChange={(event) => togglePendingOnly(event.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-joordak-coral focus:ring-[joordak-coral]"
                            />
                            فقط در انتظار پرداخت
                        </label>
                    </div>

                    {invoices.data.length === 0 ? (
                        <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '48px', textAlign: 'center' }}>
                            <p style={{ color: '#6b7280', fontSize: '18px' }}>
                                {filters.pending_only ? 'سفارشی در انتظار پرداخت یافت نشد.' : 'هنوز سفارشی ثبت نشده است.'}
                            </p>
                            <Link
                                href={route('products.index')}
                                style={{ display: 'inline-block', marginTop: '16px', backgroundColor: 'joordak-coral', color: 'white', padding: '12px 24px', borderRadius: '9999px', textDecoration: 'none', fontWeight: '500' }}
                            >
                                مشاهده محصولات
                            </Link>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {invoices.data.map((invoice) => (
                                <div key={invoice.id} className="rounded-lg border border-gray-200 bg-white p-6">
                                    <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2">
                                        <div className="col-start-1 row-start-1 row-span-2 self-start">
                                            <p className="text-lg font-semibold">سفارش #{invoice.id}</p>
                                            <p className="mt-1 text-sm text-gray-500">
                                                {new Date(invoice.created_at).toLocaleDateString('fa-IR')}
                                            </p>
                                        </div>
                                        <p className="col-start-2 row-start-1 justify-self-end text-lg font-semibold text-joordak-coral">
                                            <Price amount={invoice.total} />
                                        </p>
                                        <span
                                            className={`col-start-2 row-start-2 justify-self-end inline-flex rounded-full px-3 py-1 text-xs font-bold ${invoiceStatusClassStorefront(invoice.status)}`}
                                        >
                                            {invoiceStatusLabel(invoice.status)}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px' }}>
                                        <Link
                                            href={route('invoices.show', invoice.id)}
                                            style={{ display: 'inline-flex', border: '1px solid #d1d5db', borderRadius: '9999px', padding: '8px 12px', color: '#374151', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}
                                        >
                                            مشاهده فاکتور
                                        </Link>
                                        {invoiceCanBePaid(invoice.status) && (
                                            <Link
                                                href={route('invoices.pay', invoice.id)}
                                                style={{ display: 'inline-flex', border: 0, borderRadius: '9999px', padding: '8px 12px', backgroundColor: '#059669', color: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
                                            >
                                                پرداخت
                                            </Link>
                                        )}
                                        {invoice.latest_payment?.gateway_track_id && (
                                            <span style={{ alignSelf: 'center', color: '#6b7280', fontSize: '13px' }}>
                                                کد پیگیری: {invoice.latest_payment.gateway_track_id}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ marginTop: '16px', borderTop: '1px solid #f3f4f6', paddingTop: '16px' }}>
                                        <p style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>محصولات:</p>
                                        <ul style={{ marginTop: '8px', listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {invoice.items.map((item) => (
                                                <li key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#4b5563', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                                                    <span>{item.product_name} × {item.quantity}</span>
                                                    <span><Price amount={item.line_total} /></span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            ))}
                            <AdminPagination items={invoices} />
                        </div>
                    )}
                </div>
            </div>
        </StorefrontLayout>
    );
}
