export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface Paginated<T> {
    data: T[];
    links: PaginationLink[];
    from: number | null;
    to: number | null;
    total: number;
}

export interface Option {
    id: number;
    name: string;
}

export type InvoiceStatus =
    | 'pending_payment'
    | 'processing_payment'
    | 'paid'
    | 'delivered_to_post'
    | 'failed'
    | 'cancelled';

export interface AdminInvoiceSummary {
    id: number;
    status: InvoiceStatus;
    total: number;
    shipping_cost: number;
    created_at: string | null;
    customer_name: string;
    customer_phone: string | null;
    address: string | null;
    postal_code: string | null;
}

export interface AdminSubProduct {
    id: number;
    price: number;
    stock: number;
    size: string | null;
    color_name: string | null;
    color_hex: string | null;
    discount_type: DiscountType | null;
    discount_value: number | null;
    discount_starts_at: string | null;
    discount_ends_at: string | null;
    discount_usage_limit: number | null;
    discount_used_count: number;
    photo_urls: string[];
    photo_preview_urls: Array<string | null>;
}

export interface AdminProduct {
    id: number;
    category_id: number | null;
    category_name: string | null;
    title: string;
    slug: string;
    excerpt: string | null;
    description: string | null;
    price: number;
    stock: number;
    size: string | null;
    color_name: string | null;
    color_hex: string | null;
    image_url: string | null;
    image_preview_url: string | null;
    subproducts: AdminSubProduct[];
    is_active: boolean;
    created_at: string | null;
}

export type DiscountType = 'percent' | 'amount';

export interface AdminDiscountCode {
    id: number;
    code: string;
    type: DiscountType;
    value: number;
    max_discount: number | null;
    starts_at: string | null;
    ends_at: string | null;
    usage_limit: number | null;
    used_count: number;
    is_active: boolean;
    created_at: string | null;
}

export interface AdminCategory {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    image_url: string | null;
    image_preview_url: string | null;
    products_count: number | null;
    created_at: string | null;
}

export interface AdminBlogPost {
    id: number;
    user_id: number | null;
    author_name: string | null;
    title: string;
    slug: string;
    excerpt: string | null;
    content: string;
    image_url: string | null;
    image_preview_url: string | null;
    is_published: boolean;
    published_at: string | null;
    created_at: string | null;
}

export interface AdminManagedUser {
    id: number;
    name: string;
    surname: string | null;
    email: string | null;
    phone: string;
    address: string | null;
    address_province: string | null;
    postal_code: string | null;
    role: 'admin' | 'customer';
    email_verified_at: string | null;
    created_at: string | null;
}
