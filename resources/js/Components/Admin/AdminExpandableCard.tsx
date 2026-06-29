import type { ReactNode } from 'react';
import { useState } from 'react';
import AdminCard from '@/Components/Admin/AdminCard';

interface AdminExpandableCardProps {
    title: string;
    children: ReactNode;
    defaultExpanded?: boolean;
    className?: string;
}

export default function AdminExpandableCard({
    title,
    children,
    defaultExpanded = false,
    className = '',
}: AdminExpandableCardProps) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    return (
        <AdminCard className={`overflow-hidden p-0 ${className}`}>
            <button
                type="button"
                onClick={() => setIsExpanded((expanded) => !expanded)}
                className="flex w-full items-center justify-between gap-3 p-5 text-right transition hover:bg-slate-50"
                aria-expanded={isExpanded}
            >
                <h2 className="text-lg font-black text-slate-900">{title}</h2>
                <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                >
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                        <path
                            fillRule="evenodd"
                            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                            clipRule="evenodd"
                        />
                    </svg>
                </span>
            </button>
            {isExpanded && <div className="space-y-4 border-t border-slate-200 px-5 pb-5 pt-4">{children}</div>}
        </AdminCard>
    );
}
