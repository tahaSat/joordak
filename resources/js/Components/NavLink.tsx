import { Link } from '@inertiajs/react';
import { ComponentProps, ReactNode } from 'react';

type NavLinkProps = ComponentProps<typeof Link> & {
    active?: boolean;
    children?: ReactNode;
};

export default function NavLink({
    active = false,
    className = '',
    children,
    ...props
}: NavLinkProps) {
    return (
        <Link
            {...props}
            className={
                'inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium leading-5 transition duration-150 ease-in-out focus:outline-none ' +
                (active
                    ? 'border-indigo-400 text-joordak-foreground focus:border-indigo-700'
                    : 'border-transparent text-joordak-foreground hover:border-gray-300 hover:text-joordak-foreground focus:border-gray-300 focus:text-joordak-foreground') +
                className
            }
        >
            {children}
        </Link>
    );
}
