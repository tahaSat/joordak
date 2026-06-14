import { Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import StorefrontLayout from '@/Layouts/StorefrontLayout';

interface Payment {
    id: number;
    status: string;
    gateway_track_id: string | null;
}

interface Invoice {
    id: number;
    total: number;
    status: string;
    latest_payment: Payment | null;
}

interface StartPaymentResponse {
    ok: boolean;
    payment?: Payment;
    gateway_url?: string;
    redirect_url?: string;
    message?: string;
}

function Price({ amount }: { amount: number }) {
    return <span>﷼{Math.round(Number(amount)).toLocaleString()}</span>;
}

export default function ZibalProcess({ invoice }: { invoice: Invoice }) {
    const [payment, setPayment] = useState<Payment | null>(invoice.latest_payment);
    const [gatewayUrl, setGatewayUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const startPayment = async () => {
            setLoading(true);
            setError(null);

            try {
                const { data } = await window.axios.post<StartPaymentResponse>(
                    route('invoices.pay.start', invoice.id),
                );

                if (cancelled) {
                    return;
                }

                if (data.redirect_url) {
                    window.location.href = data.redirect_url;
                    return;
                }

                if (!data.ok || !data.gateway_url || !data.payment?.gateway_track_id) {
                    setError(data.message ?? 'امکان شروع پرداخت وجود ندارد. لطفاً دوباره تلاش کنید.');
                    return;
                }

                setPayment(data.payment);
                setGatewayUrl(data.gateway_url);
            } catch {
                if (!cancelled) {
                    setError('ارتباط با درگاه پرداخت برقرار نشد. لطفاً دوباره تلاش کنید.');
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        startPayment();

        return () => {
            cancelled = true;
        };
    }, [invoice.id]);

    return (
        <StorefrontLayout title={`پرداخت فاکتور #${invoice.id}`} seo={{ noIndex: true }}>
            <div className="mx-auto max-w-2xl py-10 text-center">
                <div className="rounded-2xl border border-sky-100 bg-white p-8 shadow-sm">
                    <p className="text-sm font-semibold text-joordak-coral">پرداخت آنلاین با زیبال</p>
                    <h1 className="mt-3 text-3xl font-black text-slate-900">آماده‌سازی پرداخت</h1>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                        در حال ایجاد کد پیگیری پرداخت برای فاکتور #{invoice.id} هستیم.
                    </p>

                    <div className="mt-6 rounded-xl bg-slate-50 p-4">
                        <p className="text-sm text-slate-500">مبلغ قابل پرداخت</p>
                        <p className="mt-1 text-2xl font-black text-joordak-coral">
                            <Price amount={invoice.total} />
                        </p>
                    </div>

                    {loading && (
                        <div className="mt-6 rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm font-semibold text-amber-700">
                            لطفاً چند لحظه صبر کنید...
                        </div>
                    )}

                    {error && (
                        <div className="mt-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm leading-7 text-red-700">
                            {error}
                        </div>
                    )}

                    {payment?.gateway_track_id && !error && (
                        <div className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                            <p className="text-sm text-emerald-700">کد پیگیری پرداخت</p>
                            <p className="mt-1 text-xl font-black text-emerald-900">{payment.gateway_track_id}</p>
                        </div>
                    )}

                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                        {gatewayUrl && !error && (
                            <a
                                href={gatewayUrl}
                                className="rounded-full bg-joordak px-6 py-3 font-semibold text-white transition hover:bg-[#17495f]"
                            >
                                رفتن به صفحه پرداخت
                            </a>
                        )}
                        <Link
                            href={route('invoices.show', invoice.id)}
                            className="rounded-full border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                            بازگشت به فاکتور
                        </Link>
                    </div>
                </div>
            </div>
        </StorefrontLayout>
    );
}
