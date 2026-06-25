import { formatNumberFa } from '@/lib/format';
import { useEffect, useRef, useState } from 'react';

interface CartActionControlsProps {
    quantity: number;
    stock: number;
    isActive?: boolean;
    disabled?: boolean;
    onIncrease: () => void;
    onDecrease: () => void;
    variant?: 'default' | 'compact' | 'large';
}

function AnimatedQuantity({
    quantity,
    direction,
    variant = 'default',
}: {
    quantity: number;
    direction: 'up' | 'down' | null;
    variant?: 'default' | 'compact' | 'large';
}) {
    const sizeClass = variant === 'large'
        ? 'h-8 min-w-[2rem]'
        : 'h-7 min-w-[1.75rem]';

    return (
        <span className={`relative inline-flex items-center justify-center overflow-hidden tabular-nums ${sizeClass}`}>
            <span
                key={`${quantity}-${direction ?? 'none'}`}
                className={
                    direction === 'up'
                        ? 'animate-cart-quantity-up'
                        : direction === 'down'
                          ? 'animate-cart-quantity-down'
                          : 'animate-cart-quantity-pop'
                }
            >
                {formatNumberFa(quantity)}
            </span>
        </span>
    );
}

export default function CartActionControls({
    quantity,
    stock,
    isActive = true,
    disabled = false,
    onIncrease,
    onDecrease,
    variant = 'default',
}: CartActionControlsProps) {
    const isCompact = variant === 'compact';
    const isLarge = variant === 'large';
    const [displayQuantity, setDisplayQuantity] = useState(quantity);
    const [direction, setDirection] = useState<'up' | 'down' | null>(null);
    const isOptimistic = useRef(false);

    useEffect(() => {
        if (isOptimistic.current) {
            if (quantity === displayQuantity) {
                isOptimistic.current = false;
            }

            return;
        }

        setDisplayQuantity(quantity);
        setDirection(null);
    }, [quantity, displayQuantity]);

    const isOutOfStock = !isActive || stock <= 0;
    const hasReachedStock = isOutOfStock || displayQuantity >= stock;

    const buttonClass = `flex cursor-pointer items-center justify-center rounded-full border-none bg-joordak text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${
        isLarge
            ? 'h-10 w-10 text-base'
            : isCompact
              ? 'h-8 w-8 text-sm md:h-9 md:w-9 md:text-base'
              : 'h-9 w-9 text-base'
    }`;

    const quantityClass = isLarge
        ? 'text-lg font-bold text-joordak-coral'
        : isCompact
          ? 'text-xs font-bold text-joordak-coral md:text-sm'
          : 'text-sm font-bold text-joordak-coral';

    const gapClass = isLarge ? 'gap-4' : isCompact ? 'gap-2 md:gap-3' : 'gap-3';

    const handleIncrease = () => {
        if (disabled || hasReachedStock) return;

        isOptimistic.current = true;
        setDirection('up');
        setDisplayQuantity((current) => current + 1);
        onIncrease();
    };

    const handleDecrease = () => {
        if (disabled) return;

        if (displayQuantity <= 1) {
            onDecrease();
            return;
        }

        isOptimistic.current = true;
        setDirection('down');
        setDisplayQuantity((current) => current - 1);
        onDecrease();
    };

    return (
        <div className={`flex items-center justify-center ${gapClass}`}>
            <button
                type="button"
                onClick={handleIncrease}
                disabled={disabled || hasReachedStock}
                className={buttonClass}
                aria-label="افزایش تعداد"
            >
                +
            </button>
            <span className={quantityClass}>
                <AnimatedQuantity quantity={displayQuantity} direction={direction} variant={variant} />
            </span>
            <button
                type="button"
                onClick={handleDecrease}
                disabled={disabled}
                className={buttonClass}
                aria-label="کاهش تعداد"
            >
                -
            </button>
        </div>
    );
}
