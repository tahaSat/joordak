import type { Paginated } from '@/types/admin';
import { Link } from '@inertiajs/react';

interface AdminPaginationProps<T> {
    items: Paginated<T>;
}

export default function AdminPagination<T>({ items }: AdminPaginationProps<T>) {
    if (items.links.length <= 3) {
        return null;
    }

    return (
        <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
            <span>
                نمایش {items.from ?? 0} تا {items.to ?? 0} از {items.total}
            </span>
            <div className="flex flex-wrap gap-2">
                {items.links.map((link, index) => (
                    link.url ? (
                        <Link
                            key={`${link.label}-${index}`}
                            href={link.url}
                            preserveScroll
                            className={`rounded-lg border px-3 py-1.5 ${link.active ? 'border-joordak bg-joordak text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ) : (
                        <span
                            key={`${link.label}-${index}`}
                            className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-1.5 text-slate-300"
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    )
                ))}
            </div>
        </div>
    );
}
