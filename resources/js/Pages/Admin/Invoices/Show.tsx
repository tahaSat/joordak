import AdminCard from '@/Components/Admin/AdminCard';
import AdminDangerAction from '@/Components/Admin/AdminDangerAction';
import AdminStatusBadge from '@/Components/Admin/AdminStatusBadge';
import AdminTable from '@/Components/Admin/AdminTable';
import AdminLayout from '@/Layouts/AdminLayout';
import { formatDateFa, formatPrice } from '@/lib/format';
import type { AdminInvoiceSummary } from '@/types/admin';
import { Link, useForm } from '@inertiajs/react';
import { IconArrowLeft } from '@tabler/icons-react';
import { FormEvent } from 'react';

interface InvoiceItem {
    id: number;
    product_name: string;
    unit_price: number;
    quantity: number;
    line_total: number;
}

interface LatestPayment {
    id: number;
    status: string;
    gateway_track_id: string | null;
    gateway_ref_number: string | null;
}

interface InvoiceDetail extends AdminInvoiceSummary {
    payment_reference: string | null;
    post_tracking_code: string | null;
    paid_at: string | null;
    items: InvoiceItem[];
    latest_payment: LatestPayment | null;
}

interface InvoiceShowProps {
    invoice: InvoiceDetail;
}

export default function InvoiceShow({ invoice }: InvoiceShowProps) {
    const deliverForm = useForm({
        post_tracking_code: invoice.post_tracking_code ?? '',
    });

    const canCancel = !['cancelled', 'delivered_to_post'].includes(invoice.status);
    const canDeliver = invoice.status === 'paid';

    function deliver(event: FormEvent) {
        event.preventDefault();
        deliverForm.post(route('admin.invoices.deliver-to-post', invoice.id), {
            preserveScroll: true,
        });
    }

    return (
        <AdminLayout title={`سفارش #${invoice.id}`}>
            <div className="mb-6 flex items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-black text-slate-900">{`سفارش #${invoice.id}`}</h1>
                    <p className="mt-2 text-sm text-slate-500">جزئیات سفارش و عملیات پردازش.</p>
                </div>
                <Link
                    href={route('admin.invoices.index')}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-joordak text-xl font-black text-white shadow-sm transition hover:bg-[#17475c]"
                    aria-label="بازگشت به سفارشات"
                >
                    <IconArrowLeft size={20} stroke={2.5} />
                </Link>
            </div>

            <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
                <AdminCard>
                    <div className="mb-5 grid min-w-0 gap-4 md:grid-cols-2">
                        <Info label="مشتری" value={invoice.customer_name || 'بدون نام'} />
                        <Info label="موبایل" value={invoice.customer_phone ?? '—'} />
                        <Info label="آدرس" value={invoice.address ?? '—'} />
                        <Info label="کد پستی" value={invoice.postal_code ?? '—'} />
                        <Info label="مبلغ کل" value={formatPrice(invoice.total)} />
                        <Info label="هزینه ی ارسال" value={formatPrice(invoice.shipping_cost)} />
                        <Info label="تاریخ ثبت" value={formatDateFa(invoice.created_at)} />
                        <Info label="تاریخ پرداخت" value={formatDateFa(invoice.paid_at)} />
                        <Info label="مرجع پرداخت" value={invoice.payment_reference ?? '—'} />
                        <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-400">وضعیت</p>
                            <div className="mt-2"><AdminStatusBadge status={invoice.status} /></div>
                        </div>
                        <Info label="کد رهگیری پست" value={invoice.post_tracking_code ?? '—'} />
                    </div>

                    <h2 className="mb-3 text-lg font-black text-slate-900">اقلام سفارش</h2>
                    <AdminTable headers={['محصول', 'قیمت واحد', 'تعداد', 'جمع']}>
                        {invoice.items.map((item) => (
                            <tr key={item.id}>
                                <td className="min-w-48 max-w-72 whitespace-normal break-words px-4 py-3 font-bold">{item.product_name}</td>
                                <td className="whitespace-nowrap px-4 py-3">{formatPrice(item.unit_price)}</td>
                                <td className="whitespace-nowrap px-4 py-3">{item.quantity}</td>
                                <td className="whitespace-nowrap px-4 py-3 font-bold">{formatPrice(item.line_total)}</td>
                            </tr>
                        ))}
                    </AdminTable>
                </AdminCard>

                <div className="min-w-0 space-y-5">
                    <AdminCard>
                        <h2 className="mb-4 text-lg font-black text-slate-900">عملیات سفارش</h2>
                        <div className="space-y-3">
                            {canCancel && (
                                <AdminDangerAction
                                    href={route('admin.invoices.cancel', invoice.id)}
                                    method="post"
                                    label="لغو سفارش"
                                    confirmMessage="آیا از لغو این سفارش مطمئن هستید؟"
                                />
                            )}
                            {canDeliver && (
                                <form onSubmit={deliver} className="space-y-3">
                                    <input
                                        value={deliverForm.data.post_tracking_code}
                                        onChange={(event) => deliverForm.setData('post_tracking_code', event.target.value)}
                                        placeholder="کد رهگیری پست"
                                        className="w-full rounded-xl border-slate-200 text-sm"
                                    />
                                    {deliverForm.errors.post_tracking_code && (
                                        <p className="text-xs font-bold text-rose-600">{deliverForm.errors.post_tracking_code}</p>
                                    )}
                                    <button disabled={deliverForm.processing} className="w-full rounded-xl bg-joordak px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
                                        تحویل به پست
                                    </button>
                                </form>
                            )}
                            {!canCancel && !canDeliver && (
                                <p className="text-sm font-semibold text-slate-500">عملیات بیشتری برای این وضعیت موجود نیست.</p>
                            )}
                        </div>
                    </AdminCard>

                    <AdminCard>
                        <h2 className="mb-4 text-lg font-black text-slate-900">آخرین پرداخت</h2>
                        {invoice.latest_payment ? (
                            <div className="space-y-3 text-sm">
                                <Info label="وضعیت" value={invoice.latest_payment.status} />
                                <Info label="کد پیگیری" value={invoice.latest_payment.gateway_track_id ?? '—'} />
                                <Info label="شماره مرجع" value={invoice.latest_payment.gateway_ref_number ?? '—'} />
                            </div>
                        ) : (
                            <p className="text-sm font-semibold text-slate-500">پرداختی ثبت نشده است.</p>
                        )}
                    </AdminCard>
                </div>
            </div>
        </AdminLayout>
    );
}

function Info({ label, value }: { label: string; value: string }) {
    return (
        <div className="min-w-0">
            <p className="text-xs font-bold text-slate-400">{label}</p>
            <p className="mt-1 break-words font-bold text-slate-800">{value}</p>
        </div>
    );
}
