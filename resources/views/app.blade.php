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

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/Pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
