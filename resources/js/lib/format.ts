import type { InvoiceStatus } from '@/types/admin';

export function formatPrice(amount: number | string): string {
    return `﷼${Math.round(Number(amount)).toLocaleString()}`;
}

export function formatDateFa(value?: string | null): string {
    if (!value) {
        return '—';
    }

    return new Date(value).toLocaleDateString('fa-IR');
}

export function invoiceStatusLabel(status: InvoiceStatus | string): string {
    const labels: Record<string, string> = {
        pending_payment: 'در انتظار پرداخت',
        processing_payment: 'در حال پردازش پرداخت',
        paid: 'پرداخت شده',
        delivered_to_post: 'تحویل پست داده شده',
        failed: 'ناموفق',
        cancelled: 'لغو شده',
    };

    return labels[status] ?? status;
}

const NON_PAYABLE_INVOICE_STATUSES = new Set(['paid', 'delivered_to_post', 'cancelled']);

export function invoiceCanBePaid(status: InvoiceStatus | string): boolean {
    return !NON_PAYABLE_INVOICE_STATUSES.has(status);
}

export function invoiceStatusClass(status: InvoiceStatus | string): string {
    if (status === 'paid') {
        return 'bg-emerald-100 text-emerald-800';
    }

    if (status === 'delivered_to_post') {
        return 'bg-sky-100 text-sky-800';
    }

    if (status === 'failed' || status === 'cancelled') {
        return 'bg-rose-100 text-rose-800';
    }

    return 'bg-amber-100 text-amber-800';
}

export function invoiceStatusClassStorefront(status: InvoiceStatus | string): string {
    if (status === 'paid') {
        return 'bg-emerald-100 text-emerald-800';
    }

    if (status === 'delivered_to_post') {
        return 'bg-blue-100 text-blue-800';
    }

    if (status === 'processing_payment') {
        return 'bg-gray-100 text-gray-800';
    }

    if (status === 'pending_payment') {
        return 'bg-yellow-100 text-yellow-800';
    }

    if (status === 'failed') {
        return 'bg-red-100 text-red-800';
    }

    if (status === 'cancelled') {
        return 'bg-rose-100 text-rose-800';
    }

    return 'bg-amber-100 text-amber-800';
}
