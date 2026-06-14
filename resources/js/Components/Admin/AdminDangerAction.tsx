import { Link } from '@inertiajs/react';

interface AdminDangerActionProps {
    href: string;
    label: string;
    method?: 'post' | 'delete';
    confirmMessage?: string;
}

export default function AdminDangerAction({ href, label, method = 'delete', confirmMessage = 'آیا مطمئن هستید؟' }: AdminDangerActionProps) {
    return (
        <Link
            href={href}
            method={method}
            as="button"
            preserveScroll
            onBefore={() => window.confirm(confirmMessage)}
            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100"
        >
            {label}
        </Link>
    );
}
