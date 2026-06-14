import type { ReactNode } from 'react';

interface AdminFormFieldProps {
    label: string;
    labelHelper?: string;
    error?: string;
    children: ReactNode;
}

export default function AdminFormField({ label, labelHelper, error, children }: AdminFormFieldProps) {
    return (
        <div className="block min-w-0">
            <span className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
                <span>{label}</span>
                {labelHelper && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">{labelHelper}</span>}
            </span>
            {children}
            {error && <span className="mt-1 block text-xs font-semibold text-rose-600">{error}</span>}
        </div>
    );
}
