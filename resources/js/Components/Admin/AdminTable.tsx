import type { ReactNode } from 'react';

interface AdminTableProps {
    headers: string[];
    children: ReactNode;
}

export default function AdminTable({ headers, children }: AdminTableProps) {
    return (
        <div className="min-w-0 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-right text-sm">
                <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                    <tr>
                        {headers.map((header) => (
                            <th key={header} className="whitespace-nowrap px-4 py-3">
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                    {children}
                </tbody>
            </table>
        </div>
    );
}
