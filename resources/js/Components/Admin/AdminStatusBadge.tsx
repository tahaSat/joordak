import { invoiceStatusClass, invoiceStatusLabel } from '@/lib/format';
import type { InvoiceStatus } from '@/types/admin';

interface AdminStatusBadgeProps {
    status: InvoiceStatus | string;
}

export default function AdminStatusBadge({ status }: AdminStatusBadgeProps) {
    return (
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${invoiceStatusClass(status)}`}>
            {invoiceStatusLabel(status)}
        </span>
    );
}
