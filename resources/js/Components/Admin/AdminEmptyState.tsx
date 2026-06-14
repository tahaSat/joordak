interface AdminEmptyStateProps {
    message: string;
}

export default function AdminEmptyState({ message }: AdminEmptyStateProps) {
    return (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">
            {message}
        </div>
    );
}
