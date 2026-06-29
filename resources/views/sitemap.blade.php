{!! sprintf('<%sxml version="1.0" encoding="UTF-8"?>', '?') !!}
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
@foreach ($urls as [$url, $updatedAt, $changefreq, $priority])
    <url>
        <loc>{{ $url }}</loc>
        <lastmod>{{ $updatedAt?->toDateString() ?? now()->toDateString() }}</lastmod>
        <changefreq>{{ $changefreq }}</changefreq>
        <priority>{{ $priority }}</priority>
    </url>
@endforeach
</urlset>
