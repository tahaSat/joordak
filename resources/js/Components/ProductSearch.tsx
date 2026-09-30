import { Link, router } from '@inertiajs/react';
import { IconSearch, IconX } from '@tabler/icons-react';
import type { FormEvent } from 'react';
import { useEffect, useRef, useState } from 'react';

interface ProductSuggestion {
    id: number;
    title: string;
    slug: string;
    image_url: string | null;
    category: { name: string } | null;
}

interface ProductSearchProps {
    currentUrl: string;
    mobile?: boolean;
}

export default function ProductSearch({ currentUrl, mobile = false }: ProductSearchProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
    const [remainingCount, setRemainingCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const normalizedSearch = searchTerm.trim();

    useEffect(() => {
        const queryString = currentUrl.split('?')[1]?.split('#')[0] ?? '';
        setSearchTerm(new URLSearchParams(queryString).get('search') ?? '');
        setIsExpanded(false);
    }, [currentUrl]);

    useEffect(() => {
        if (!normalizedSearch) {
            setSuggestions([]);
            setRemainingCount(0);
            setIsLoading(false);
            return;
        }

        const controller = new AbortController();
        setSuggestions([]);
        setRemainingCount(0);
        setIsLoading(true);

        const timeoutId = window.setTimeout(async () => {
            try {
                const response = await fetch(route('products.search.suggestions', { search: normalizedSearch }), {
                    headers: { Accept: 'application/json' },
                    signal: controller.signal,
                });

                if (!response.ok) {
                    throw new Error('Search request failed');
                }

                const payload = await response.json() as { data: ProductSuggestion[]; remaining_count: number };
                setSuggestions(payload.data);
                setRemainingCount(payload.remaining_count);
            } catch {
                if (!controller.signal.aborted) {
                    setSuggestions([]);
                    setRemainingCount(0);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            }
        }, 250);

        return () => {
            window.clearTimeout(timeoutId);
            controller.abort();
        };
    }, [normalizedSearch]);

    useEffect(() => {
        if (isExpanded) {
            inputRef.current?.focus();
        }
    }, [isExpanded]);

    useEffect(() => {
        const handlePointerDown = (event: PointerEvent) => {
            if (!containerRef.current?.contains(event.target as Node)) {
                setIsExpanded(false);
            }
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsExpanded(false);
            }
        };

        document.addEventListener('pointerdown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('pointerdown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const closeSearch = () => {
        setIsExpanded(false);
    };

    const submitSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (normalizedSearch) {
            closeSearch();
            router.get(route('products.index', { search: normalizedSearch }), {}, { preserveScroll: false });
        }
    };

    const resultContents = (
        <>
            <div className="max-h-72 overflow-y-auto py-1">
                {isLoading ? (
                    <p className="px-4 py-3 text-sm text-slate-500">در حال جستجو...</p>
                ) : suggestions.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-slate-500">محصولی پیدا نشد</p>
                ) : (
                    suggestions.map((product) => (
                        <Link
                            key={product.id}
                            href={route('products.show', product.slug)}
                            onClick={closeSearch}
                            className="flex items-center gap-3 px-4 py-2.5 text-right transition hover:bg-slate-50"
                        >
                            {product.image_url && (
                                <img src={product.image_url} alt="" loading="lazy" className="h-10 w-10 shrink-0 rounded-md object-cover" />
                            )}
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-semibold text-slate-900">{product.title}</span>
                                {product.category && (
                                    <span className="mt-0.5 block truncate text-xs text-slate-500">{product.category.name}</span>
                                )}
                            </span>
                        </Link>
                    ))
                )}
            </div>
            {remainingCount > 0 && (
                <Link
                    href={route('products.index', { search: normalizedSearch })}
                    onClick={closeSearch}
                    className="block border-t border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                >
                    مشاهده ی همه ({remainingCount})
                </Link>
            )}
        </>
    );

    return (
        <div
            ref={containerRef}
            className={`relative z-[60] w-10 transition-[width] duration-200 ${isExpanded ? (mobile ? 'w-[min(calc(100vw-10rem),20rem)] sm:w-56' : 'w-56') : ''}`}
        >
            {isExpanded ? (
                <form onSubmit={submitSearch} className="flex h-10 w-full items-center gap-2 rounded-full border border-white/40 bg-white px-3 text-slate-900 shadow-sm">
                    <button type="submit" aria-label="جستجو" className="shrink-0 text-slate-600 hover:text-slate-900">
                        <IconSearch size={20} stroke={1.8} aria-hidden="true" />
                    </button>
                    <input
                        ref={inputRef}
                        type="search"
                        dir="rtl"
                        maxLength={100}
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="نام محصول یا دسته‌بندی"
                        aria-label="جستجوی محصول یا دسته‌بندی"
                        className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-slate-900 placeholder:text-slate-500 focus:ring-0"
                    />
                    <button type="button" onClick={closeSearch} aria-label="بستن جستجو" className="shrink-0 text-slate-500 hover:text-slate-900">
                        <IconX size={18} stroke={1.8} aria-hidden="true" />
                    </button>
                </form>
            ) : (
                <button
                    type="button"
                    onClick={() => setIsExpanded(true)}
                    aria-label="جستجو"
                    aria-expanded={false}
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-white transition ${mobile ? 'bg-transparent hover:bg-transparent' : 'bg-white/10 hover:bg-white/20'} focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70`}
                >
                    <IconSearch size={20} stroke={1.8} className={mobile ? 'translate-x-1' : undefined} aria-hidden="true" />
                </button>
            )}
            {isExpanded && normalizedSearch && (
                <div className="absolute end-0 top-full mt-2 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-md border border-slate-200 bg-white text-slate-900 shadow-xl" dir="rtl">
                    {resultContents}
                </div>
            )}
        </div>
    );
}