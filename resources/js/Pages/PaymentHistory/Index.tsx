import { joordakColors } from '@/constants/theme';
import StorefrontLayout from '@/Layouts/StorefrontLayout';
import { Head, Link } from '@inertiajs/react';

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

interface PaymentHistoryProps {
    invoices: Invoice[];
}

function Price({ amount }: { amount: number }) {
    return <span>﷼{Math.round(Number(amount)).toLocaleString()}</span>;
}

export default function PaymentHistory({ invoices }: PaymentHistoryProps) {
    return (
        <StorefrontLayout title="پرداخت ها" seo={{ noIndex: true }}>
            <Head title="پرداخت ها" />

            <div style={{ padding: '48px 0' }}>
                <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
                    <h1 className="text-3xl font-black mb-6">پرداخت ها</h1>

                    {invoices.length === 0 ? (
                        <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '48px', textAlign: 'center' }}>
                            <p style={{ color: joordakColors.text, fontSize: '18px' }}>هنوز سفارشی ثبت نشده است.</p>
                            <Link
                                href={route('products.index')}
                                style={{ display: 'inline-block', marginTop: '16px', backgroundColor: joordakColors.primary, color: joordakColors.foreground, padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: '500' }}
                            >
                                مشاهده محصولات
                            </Link>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {invoices.map((invoice) => (
                                <div key={invoice.id} style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                                        <div>
                                            <p style={{ fontWeight: '600', fontSize: '18px' }}>سفارش #{invoice.id}</p>
                                            <p style={{ fontSize: '14px', color: joordakColors.text, marginTop: '4px' }}>
                                                {new Date(invoice.created_at).toLocaleDateString('fa-IR')}
                                            </p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ fontWeight: '600', color: joordakColors.accent, fontSize: '18px' }}>
                                                <Price amount={invoice.total} />
                                            </p>
                                            <span style={{
                                                display: 'inline-flex',
                                                borderRadius: '9999px',
                                                padding: '4px 12px',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                backgroundColor: invoice.status === 'paid' ? '#dcfce7' : '#fef9c3',
                                                color: joordakColors.text,
                                                marginTop: '8px'
                                            }}>
                                                {invoice.status === 'paid' ? 'پرداخت شده' : 'در انتظار پرداخت'}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '16px', borderTop: '1px solid #f3f4f6', paddingTop: '16px' }}>
                                        <p style={{ fontSize: '14px', fontWeight: '500', color: joordakColors.text }}>محصولات:</p>
                                        <ul style={{ marginTop: '8px', listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {invoice.items.map((item) => (
                                                <li key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: joordakColors.text, padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                                                    <span>{item.product_name} × {item.quantity}</span>
                                                    <span><Price amount={item.line_total} /></span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </StorefrontLayout>
    );
}
