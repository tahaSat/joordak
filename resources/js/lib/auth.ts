const AUTH_PATHS = ['/login', '/register'];

function isAuthPath(path: string): boolean {
    const pathOnly = path.split('?')[0] ?? path;

    return AUTH_PATHS.some((authPath) => pathOnly === authPath || pathOnly.startsWith(`${authPath}/`));
}

export function currentRedirectPath(fallback = '/'): string {
    if (typeof window === 'undefined') {
        return fallback;
    }

    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');

    if (redirect && redirect.startsWith('/') && !isAuthPath(redirect)) {
        return redirect;
    }

    const currentPath = `${window.location.pathname}${window.location.search}`;

    if (isAuthPath(currentPath)) {
        return fallback;
    }

    return currentPath || fallback;
}

export function loginUrl(currentUrl?: string): string {
    const redirectPath = currentUrl ?? currentRedirectPath();

    if (isAuthPath(redirectPath)) {
        return route('login');
    }

    const params = new URLSearchParams({ redirect: redirectPath });

    return `${route('login')}?${params.toString()}`;
}

export function registerUrl(currentUrl?: string): string {
    const redirectPath = currentUrl ?? currentRedirectPath();

    if (isAuthPath(redirectPath)) {
        return route('register');
    }

    const params = new URLSearchParams({ redirect: redirectPath });

    return `${route('register')}?${params.toString()}`;
}
