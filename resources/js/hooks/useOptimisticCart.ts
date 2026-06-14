import { router } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';

export type CartItemsMap = Record<number, { quantity: number; cart_item_id: number }>;

const routerOptions = {
    preserveScroll: true,
} as const;

export function useOptimisticCart(serverCartItems: CartItemsMap) {
    const [cartItems, setCartItems] = useState(serverCartItems);
    const cartItemsRef = useRef(cartItems);
    cartItemsRef.current = cartItems;

    const pendingRef = useRef(new Set<number>());
    const [pendingIds, setPendingIds] = useState<ReadonlySet<number>>(new Set());

    const syncPendingIds = () => {
        setPendingIds(new Set(pendingRef.current));
    };

    const endPending = (subProductId: number) => {
        if (!pendingRef.current.has(subProductId)) {
            return;
        }

        pendingRef.current.delete(subProductId);
        syncPendingIds();
    };

    const startPending = (subProductId: number) => {
        pendingRef.current.add(subProductId);
        syncPendingIds();
    };

    useEffect(() => {
        setCartItems((previous) => {
            const merged = { ...serverCartItems };

            for (const subProductId of pendingRef.current) {
                const localItem = previous[subProductId];

                if (!localItem) {
                    delete merged[subProductId];
                    continue;
                }

                const serverItem = serverCartItems[subProductId];

                if (!serverItem) {
                    merged[subProductId] = localItem;
                    continue;
                }

                merged[subProductId] = {
                    quantity: localItem.quantity,
                    cart_item_id: serverItem.cart_item_id,
                };
            }

            for (const [id, item] of Object.entries(previous)) {
                const subProductId = Number(id);

                if (item.cart_item_id === 0 && !(subProductId in serverCartItems)) {
                    merged[subProductId] = item;
                }
            }

            return merged;
        });

        for (const subProductId of [...pendingRef.current]) {
            const localItem = cartItemsRef.current[subProductId];
            const serverItem = serverCartItems[subProductId];

            if (!localItem) {
                if (!serverItem) {
                    endPending(subProductId);
                }

                continue;
            }

            if (serverItem?.quantity === localItem.quantity && serverItem.cart_item_id > 0) {
                endPending(subProductId);
            }
        }
    }, [serverCartItems]);

    const isPending = useCallback(
        (subProductId: number | null) => (subProductId ? pendingIds.has(subProductId) : false),
        [pendingIds],
    );

    const addToCart = useCallback((subProductId: number | null) => {
        if (!subProductId || pendingRef.current.has(subProductId)) {
            return;
        }

        startPending(subProductId);

        setCartItems((previous) => ({
            ...previous,
            [subProductId]: {
                quantity: (previous[subProductId]?.quantity ?? 0) + 1,
                cart_item_id: previous[subProductId]?.cart_item_id ?? 0,
            },
        }));

        router.post(route('cart.store'), { sub_product_id: subProductId, quantity: 1 }, {
            ...routerOptions,
            onError: () => {
                endPending(subProductId);
                setCartItems(serverCartItems);
            },
        });
    }, [serverCartItems]);

    const updateQuantity = useCallback((subProductId: number | null, quantity: number) => {
        if (!subProductId || pendingRef.current.has(subProductId)) {
            return;
        }

        const cartItemId = cartItemsRef.current[subProductId]?.cart_item_id;
        if (!cartItemId) {
            return;
        }

        startPending(subProductId);

        setCartItems((previous) => ({
            ...previous,
            [subProductId]: {
                ...previous[subProductId],
                quantity,
            },
        }));

        router.patch(route('cart.update', { cartItem: cartItemId }), { quantity }, {
            ...routerOptions,
            onError: () => {
                endPending(subProductId);
                setCartItems(serverCartItems);
            },
        });
    }, [serverCartItems]);

    const removeFromCart = useCallback((subProductId: number | null) => {
        if (!subProductId || pendingRef.current.has(subProductId)) {
            return;
        }

        const cartItemId = cartItemsRef.current[subProductId]?.cart_item_id;
        if (!cartItemId) {
            return;
        }

        startPending(subProductId);

        setCartItems((previous) => {
            const next = { ...previous };
            delete next[subProductId];
            return next;
        });

        router.delete(route('cart.destroy', { cartItem: cartItemId }), {
            ...routerOptions,
            onError: () => {
                endPending(subProductId);
                setCartItems(serverCartItems);
            },
        });
    }, [serverCartItems]);

    const increaseQuantity = useCallback((subProductId: number | null) => {
        if (!subProductId) {
            return;
        }

        const item = cartItemsRef.current[subProductId];
        if (!item) {
            return;
        }

        updateQuantity(subProductId, item.quantity + 1);
    }, [updateQuantity]);

    const decreaseQuantity = useCallback((subProductId: number | null) => {
        if (!subProductId) {
            return;
        }

        const item = cartItemsRef.current[subProductId];
        if (!item) {
            return;
        }

        if (item.quantity <= 1) {
            removeFromCart(subProductId);
            return;
        }

        updateQuantity(subProductId, item.quantity - 1);
    }, [removeFromCart, updateQuantity]);

    return {
        cartItems,
        addToCart,
        increaseQuantity,
        decreaseQuantity,
        isPending,
    };
}
