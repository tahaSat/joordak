import type { ReactNode } from 'react';

interface AdminCardProps {
    children: ReactNode;
    className?: string;
}

export default function AdminCard({ children, className = '' }: AdminCardProps) {
    return (
        <section className={`min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
            {children}
        </section>
    );
}
