import type { AxiosInstance } from 'axios';

export interface User {
    id: number;
    name: string;
    surname?: string | null;
    email: string | null;
    phone?: string | null;
    address?: string | null;
    postal_code?: string | null;
    role: string;
    email_verified_at?: string | null;
}

export type PageProps<T extends object = Record<string, unknown>> = T & {
    auth: {
        user: User | null;
    };
    cartCount: number;
};

export interface LoginPageProps {
    status?: string | null;
    otpSent?: boolean;
}

export interface RegisterPageProps {
    otpSent?: boolean;
}

export interface VerifyEmailPageProps {
    status?: string | null;
}

interface RouteCallable {
    (
        name: string,
        params?: Record<string, string | number> | string | number,
        absolute?: boolean,
    ): string;
    (): {
        current: (name?: string) => boolean;
    };
}

declare global {
    interface Window {
        axios: AxiosInstance;
    }

    const route: RouteCallable;
}

export {};
