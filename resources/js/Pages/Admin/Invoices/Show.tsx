import AdminCard from '@/Components/Admin/AdminCard';
import AdminDangerAction from '@/Components/Admin/AdminDangerAction';
import AdminStatusBadge from '@/Components/Admin/AdminStatusBadge';
import AdminLayout from '@/Layouts/AdminLayout';
import { formatDateFa, formatPrice } from '@/lib/format';
import type { AdminInvoiceSummary } from '@/types/admin';
import { Link, useForm, usePage } from '@inertiajs/react';
import { IconArrowLeft } from '@tabler/icons-react';
import { FormEvent, useEffect, useMemo } from 'react';

interface InvoiceItem {
    id: number;
    product_name: string;
    unit_price: number;
    original_unit_price: number;
    product_discount_amount: number;
    quantity: number;
    line_total: number;
    current_stock: number;
    product_is_active: boolean;
}

interface StockWarning {
    item_id: number;
    product_name: string;
    requested: number;
    available: number;
    reason: string;
}

interface LatestPayment {
    id: number;
    status: string;
    gateway_track_id: string | null;
    gateway_ref_number: string | null;
}

interface InvoiceDetail extends AdminInvoiceSummary {
    subtotal: number;
    invoice_discount_amount: number;
    discount_code: string | null;
    payment_reference: string | null;
    post_tracking_code: string | null;
    paid_at: string | null;
    items: InvoiceItem[];
    latest_payment: LatestPayment | null;
}

interface InvoiceShowProps {
    invoice: InvoiceDetail;
    stock_warnings?: StockWarning[];
}

interface EditableItem {
    id: number;
    quantity: number;
}

export default function InvoiceShow({ invoice, stock_warnings = [] }: InvoiceShowProps) {
    const { flash } = usePage<{ flash?: { status?: string } }>().props;
    const deliverForm = useForm({
        post_tracking_code: invoice.post_tracking_code ?? '',
    });

    const editForm = useForm({
        invoice_discount_amount: Math.round(invoice.invoice_discount_amount),
        items: invoice.items.map((item): EditableItem => ({
            id: item.id,
            quantity: item.quantity,
        })),
    });

    const canCancel = !['cancelled', 'delivered_to_post'].includes(invoice.status);
    const canDeliver = invoice.status === 'paid';

    const liveWarnings = useMemo(() => {
        return invoice.items.flatMap((item, index) => {
            const quantity = editForm.data.items[index]?.quantity ?? item.quantity;
            if (!item.product_is_active) {
                return [{
                    item_id: item.id,
                    product_name: item.product_name,
                    requested: quantity,
                    available: 0,
                    reason: 'unavailable',
                }];
            }
            if (quantity > item.current_stock) {
                return [{
                    item_id: item.id,
                    product_name: item.product_name,
                    requested: quantity,
                    available: item.current_stock,
                    reason: 'insufficient_stock',
                }];
            }
            return [];
        });
    }, [editForm.data.items, invoice.items]);

    const warnings = stock_warnings.length > 0 ? stock_warnings : liveWarnings;

    useEffect(() => {
        editForm.setData({
            invoice_discount_amount: Math.round(invoice.invoice_discount_amount),
            items: invoice.items.map((item): EditableItem => ({
                id: item.id,
                quantity: item.quantity,
            })),
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [invoice.id, invoice.invoice_discount_amount, invoice.items]);

    function deliver(event: FormEvent) {
        event.preventDefault();
        deliverForm.post(route('admin.invoices.deliver-to-post', invoice.id), {
            preserveScroll: true,
        });
    }

    function updateQuantity(index: number, quantity: number) {
        const next = [...editForm.data.items];
        next[index] = {
            ...next[index],
            quantity: Math.max(1, Math.min(999, quantity)),
        };
        editForm.setData('items', next);
    }

    function saveInvoice(event: FormEvent) {
        event.preventDefault();
        editForm.patch(route('admin.invoices.update', invoice.id), {
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

            {(flash?.status || warnings.length > 0) && (
                <div className="mb-5 space-y-3">
                    {flash?.status && (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
                            {flash.status}
                        </div>
                    )}
                    {warnings.length > 0 && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                            <p className="font-black">هشدار موجودی (ثبت همچنان مجاز است)</p>
                            <ul className="mt-2 space-y-1">
                                {warnings.map((warning) => (
                                    <li key={`${warning.item_id}-${warning.reason}`}>
                                        {warning.product_name}: درخواست {warning.requested} — موجودی {warning.available}
                                        {warning.reason === 'unavailable' ? ' (ناموجود/غیرفعال)' : ''}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
                <AdminCard>
                    <div className="mb-5 grid min-w-0 gap-4 md:grid-cols-2">
                        <Info label="مشتری" value={invoice.customer_name || 'بدون نام'} />
                        <Info label="موبایل" value={invoice.customer_phone ?? '—'} />
                        <Info label="آدرس" value={invoice.address ?? '—'} />
                        <Info label="کد پستی" value={invoice.postal_code ?? '—'} />
                        <Info label="تاریخ ثبت" value={formatDateFa(invoice.created_at)} />
                        <Info label="تاریخ پرداخت" value={formatDateFa(invoice.paid_at)} />
                        <Info label="مرجع پرداخت" value={invoice.payment_reference ?? '—'} />
                        <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-400">وضعیت</p>
                            <div className="mt-2"><AdminStatusBadge status={invoice.status} /></div>
                        </div>
                        <Info label="کد رهگیری پست" value={invoice.post_tracking_code ?? '—'} />
                        <Info label="کد تخفیف" value={invoice.discount_code ?? '—'} />
                    </div>

                    <form onSubmit={saveInvoice} className="space-y-5">
                        <div>
                            <h2 className="mb-3 text-lg font-black text-slate-900">ویرایش تعداد اقلام</h2>
                            <p className="mb-3 text-xs font-semibold text-slate-500">
                                قیمت واحد، هزینه ارسال و مبلغ کل پس از ذخیره بر اساس قیمت فعلی محصول و تنظیمات ارسال محاسبه می‌شوند.
                            </p>
                            <div className="overflow-x-auto rounded-xl border border-slate-200">
                                <table className="min-w-full divide-y divide-slate-200 text-sm">
                                    <thead className="bg-slate-50 text-right text-xs font-bold text-slate-500">
                                        <tr>
                                            <th className="px-4 py-3">محصول</th>
                                            <th className="px-4 py-3">قیمت واحد</th>
                                            <th className="px-4 py-3">موجودی</th>
                                            <th className="px-4 py-3">تعداد</th>
                                            <th className="px-4 py-3">جمع فعلی</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {invoice.items.map((item, index) => {
                                            const quantity = editForm.data.items[index]?.quantity ?? item.quantity;
                                            const overStock = !item.product_is_active || quantity > item.current_stock;

                                            return (
                                                <tr key={item.id} className={overStock ? 'bg-amber-50/60' : undefined}>
                                                    <td className="min-w-48 max-w-72 whitespace-normal break-words px-4 py-3 font-bold">{item.product_name}</td>
                                                    <td className="whitespace-nowrap px-4 py-3">{formatPrice(item.unit_price)}</td>
                                                    <td className="whitespace-nowrap px-4 py-3">
                                                        {item.product_is_active ? item.current_stock : 'غیرفعال'}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3">
                                                        <div className="inline-flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => updateQuantity(index, quantity - 1)}
                                                                disabled={quantity <= 1}
                                                                className="h-8 w-8 rounded-full border border-slate-300 font-bold disabled:opacity-40"
                                                            >
                                                                −
                                                            </button>
                                                            <span className="min-w-8 text-center font-black">{quantity}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => updateQuantity(index, quantity + 1)}
                                                                disabled={quantity >= 999}
                                                                className="h-8 w-8 rounded-full border border-slate-300 font-bold disabled:opacity-40"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 font-bold">{formatPrice(item.unit_price * quantity)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            {editForm.errors.items && <p className="mt-2 text-xs font-bold text-rose-600">{editForm.errors.items}</p>}
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <Info label="جمع اقلام فعلی" value={formatPrice(invoice.subtotal)} />
                            <Info label="هزینه ارسال (محاسبه‌شده)" value={formatPrice(invoice.shipping_cost)} />
                            <label className="min-w-0 block">
                                <span className="text-xs font-bold text-slate-400">تخفیف فاکتور</span>
                                <input
                                    type="number"
                                    min={0}
                                    value={editForm.data.invoice_discount_amount}
                                    onChange={(event) => editForm.setData(
                                        'invoice_discount_amount',
                                        Math.max(0, Number.parseInt(event.target.value || '0', 10) || 0),
                                    )}
                                    className="mt-1 w-full rounded-xl border-slate-200 text-sm"
                                />
                                {editForm.errors.invoice_discount_amount && (
                                    <p className="mt-1 text-xs font-bold text-rose-600">{editForm.errors.invoice_discount_amount}</p>
                                )}
                            </label>
                            <Info label="مبلغ کل فعلی" value={formatPrice(invoice.total)} />
                        </div>

                        <button
                            type="submit"
                            disabled={editForm.processing}
                            className="rounded-xl bg-joordak px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
                        >
                            {editForm.processing ? 'در حال ذخیره...' : 'ذخیره تغییرات فاکتور'}
                        </button>
                    </form>
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
