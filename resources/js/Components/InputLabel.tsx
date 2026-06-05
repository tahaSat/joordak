import { LabelHTMLAttributes, ReactNode } from 'react';

type InputLabelProps = LabelHTMLAttributes<HTMLLabelElement> & {
    value?: string;
    children?: ReactNode;
};

export default function InputLabel({
    value,
    className = '',
    children,
    ...props
}: InputLabelProps) {
    return (
        <label
            {...props}
            className={
                `block text-sm font-medium text-joordak-foreground ` +
                className
            }
        >
            {value ? value : children}
        </label>
    );
}
