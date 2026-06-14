import { Link } from '@inertiajs/react';

interface AdminPageHeaderProps {
    title: string;
    description?: string;
    actionHref?: string;
    actionLabel?: string;
    titleClassName?: string;
}

export default function AdminPageHeader({ title, description, actionHref, actionLabel, titleClassName = 'text-2xl' }: AdminPageHeaderProps) {
    return (
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
                <h1 className={`${titleClassName} font-black text-slate-900`}>{title}</h1>
                {description && <p className="mt-2 text-sm text-slate-500">{description}</p>}
            </div>
            {actionHref && actionLabel && (
                <Link
                    href={actionHref}
                    className="inline-flex items-center justify-center rounded-xl bg-joordak px-4 py-2 text-sm font-bold text-white transition hover:bg-[#17475c]"
                >
                    {actionLabel}
                </Link>
            )}
        </div>
    );
}
