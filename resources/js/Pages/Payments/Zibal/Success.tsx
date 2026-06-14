import { Link } from '@inertiajs/react';
import StorefrontLayout from '@/Layouts/StorefrontLayout';

interface Payment {
    id: number;
    status: string;
    gateway_track_id: string | null;
    gateway_ref_number: string | null;
}

interface Invoice {
    id: number;
    status: string;
    payment_reference: string | null;
    latest_payment: Payment | null;
}

export default function ZibalSuccess({ invoice }: { invoice: Invoice }) {
    const trackId = invoice.latest_payment?.gateway_track_id ?? invoice.payment_reference;

    return (
        <StorefrontLayout title="پرداخت موفق" seo={{ noIndex: true }}>
            <div className="mx-auto max-w-2xl py-10 text-center">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 shadow-sm">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-700">
                        ✓
                    </div>
                    <h1 className="mt-5 text-3xl font-black text-slate-900">پرداخت با موفقیت انجام شد</h1>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                        پرداخت فاکتور #{invoice.id} با موفقیت ثبت و تأیید شد.
                    </p>

                    {trackId && (
                        <div className="mt-6 rounded-xl border border-emerald-200 bg-white p-4">
                            <p className="text-sm text-emerald-700">کد پیگیری پرداخت</p>
                            <p className="mt-1 text-xl font-black text-emerald-900">{trackId}</p>
                        </div>
                    )}

                    <div className="mt-6">
                        <Link
                            href={route('invoices.show', invoice.id)}
                            className="inline-flex rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700"
                        >
                            بازگشت به فاکتور
                        </Link>
                    </div>
                </div>
            </div>
        </StorefrontLayout>
    );
}
