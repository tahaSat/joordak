import { Link } from '@inertiajs/react';
import StorefrontLayout from '@/Layouts/StorefrontLayout';

function Price({ amount }) {
    return <span>﷼{Math.round(Number(amount)).toLocaleString()}</span>;
}

function getStatusLabel(status: string): string {
    const statusMap: Record<string, string> = {
        'pending_payment': 'در انتظار پرداخت',
        'paid': 'پرداخت شده',
        'failed': 'ناموفق',
        'cancelled': 'لغو شده',
    };
    return statusMap[status] || status;
}

export default function InvoiceShow({ invoice }) {
    return (
        <StorefrontLayout title={`فاکتور #${invoice.id}`} seo={{ noIndex: true }}>
            <h1 className="text-3xl font-black">فاکتور #{invoice.id}</h1>
            <p className="mt-2 text-joordak-foreground">وضعیت: <span className="font-semibold text-joordak-foreground">{getStatusLabel(invoice.status)}</span></p>

            <div className="mt-6 rounded-xl border border-stone-200 bg-white p-5">
                <h2 className="text-lg font-semibold">اقلام</h2>
                <div className="mt-4 divide-y divide-stone-200">
                    {invoice.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between py-3 text-sm">
                            <div>
                                <p className="font-medium">{item.product_name}</p>
                                <p className="text-joordak-foreground">{item.quantity} x <Price amount={item.unit_price} /></p>
                            </div>
                            <p className="font-semibold"><Price amount={item.line_total} /></p>
                        </div>
                    ))}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-stone-200 pt-4">
                    <p className="text-sm text-joordak-foreground">جمع کل</p>
                    <p className="text-2xl font-black text-joordak-foreground"><Price amount={invoice.total} /></p>
                </div>
            </div>

            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-joordak-foreground">
                فرآیند پرداخت: درگاه پرداخت خود را اینجا متصل کنید و پس از تأیید وضعیت فاکتور را به‌روزرسانی کنید.
            </div>

            <Link href={route('products.index')} className="mt-6 inline-block rounded-lg bg-stone-900 px-4 py-2 text-white">
                ادامه خرید
            </Link>
        </StorefrontLayout>
    );
}
