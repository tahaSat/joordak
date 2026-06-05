import { Link } from '@inertiajs/react';
import { ComponentProps, ReactNode } from 'react';

type ResponsiveNavLinkProps = ComponentProps<typeof Link> & {
    active?: boolean;
    children?: ReactNode;
};

export default function ResponsiveNavLink({
    active = false,
    className = '',
    children,
    ...props
}: ResponsiveNavLinkProps) {
    return (
        <Link
            {...props}
            className={`flex w-full items-start border-l-4 py-2 pe-4 ps-3 ${
                active
                    ? 'border-indigo-400 bg-indigo-50 text-indigo-700 focus:border-indigo-700 focus:bg-indigo-100 focus:text-indigo-800'
                    : 'border-transparent text-joordak-foreground hover:border-gray-300 hover:bg-gray-50 hover:text-joordak-foreground focus:text-joordak-foreground'
            } text-base font-medium transition duration-150 ease-in-out focus:outline-none ${className}`}
        >
            {children}
        </Link>
    );
}
