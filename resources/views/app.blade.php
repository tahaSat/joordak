<!DOCTYPE html>
<html lang="fa" dir="rtl">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title inertia>{{ config('app.name', 'Joordak') }}</title>
        <meta name="description" content="فروشگاه آنلاین جردک — استایل خود را از بالا تا پایین بسازید." />
        <meta name="robots" content="index, follow" />
        <meta property="og:site_name" content="{{ config('app.name', 'Joordak') }}" />
        <meta property="og:locale" content="fa_IR" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="preload" href="/fonts/iranian-sans/IranianSans-Regular.woff2" as="font" type="font/woff2" crossorigin>
        <link rel="preload" href="/fonts/iranian-sans/IranianSans-Bold.woff2" as="font" type="font/woff2" crossorigin>
        @if (($page['component'] ?? null) === 'Welcome' && filled(data_get($page, 'props.heroImageUrl')))
            <link rel="preload" href="{{ data_get($page, 'props.heroImageUrl') }}" as="image" fetchpriority="high">
        @endif

        @php
            $structuredDataGraph = array_values(array_filter(array_merge(
                data_get($page, 'props.structuredDataGlobal', []),
                data_get($page, 'props.structuredData', []),
            )));
        @endphp
        @if ($structuredDataGraph !== [])
            @php
                $structuredDataJson = json_encode([
                    '@context' => 'https://schema.org',
                    '@graph' => $structuredDataGraph,
                ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
            @endphp
            <script type="application/ld+json">
                {!! $structuredDataJson !!}
            </script>
        @endif

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/Pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
        @unless (str_starts_with($page['component'], 'Admin/'))
        <script>
            (function () {
                if (window.location.pathname.startsWith('/admin')) {
                    return;
                }

                const initDuck = function () {
                    if (typeof window.createDuck !== 'function') {
                        return;
                    }

                    window.joordakDuck = window.createDuck({
                        speed: 24,
                        fps: 60,
                        behaviorMode: 0,
                        idleThreshold: 6,
                        allowBehaviorChange: true,
                        startX: 0,
                        startY: 0,
                    });
                };

                const loadDuckScript = function () {
                    if (window.location.pathname.startsWith('/admin') || document.querySelector('script[src="/duck.js"]')) {
                        return;
                    }

                    const script = document.createElement('script');
                    script.src = '/duck.js';
                    script.async = true;
                    script.onload = function () {
                        if ('requestIdleCallback' in window) {
                            window.requestIdleCallback(initDuck, { timeout: 1000 });
                        } else {
                            setTimeout(initDuck, 200);
                        }
                    };
                    document.body.appendChild(script);
                };

                if (document.readyState === 'complete') {
                    loadDuckScript();
                } else {
                    window.addEventListener('load', loadDuckScript, { once: true });
                }
            })();
        </script>
        @endunless
    </body>
</html>
