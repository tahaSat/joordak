import StorefrontLayout from '@/Layouts/StorefrontLayout';

interface AboutShowProps {
    cover: {
        path: string | null;
        preview_url: string | null;
    };
    description: string;
    metaDescription: string;
}

const pageTitle = 'درباره ی ما';

export default function AboutShow({ cover, description, metaDescription }: AboutShowProps) {
    const hasContent = description.trim() !== '' || Boolean(cover.preview_url);

    return (
        <StorefrontLayout
            title={pageTitle}
            seo={{
                description: metaDescription,
                image: cover.preview_url,
                canonicalUrl: route('about-us'),
                type: 'article',
                noIndex: !hasContent,
            }}
        >
            <article className="mx-auto max-w-4xl" itemScope itemType="https://schema.org/AboutPage">
                <h1 className="text-3xl font-black text-joordak-coral sm:text-4xl" itemProp="name">{pageTitle}</h1>

                {cover.preview_url ? (
                    <div className="mt-6 overflow-hidden rounded-2xl border border-[joordak-soft] bg-white shadow-sm">
                        <img
                            src={cover.preview_url}
                            alt={pageTitle}
                            className="aspect-[37/10] w-full object-cover"
                            loading="eager"
                            decoding="async"
                            itemProp="image"
                        />
                    </div>
                ) : null}

                {description.trim() ? (
                    <div className="mt-8 rounded-2xl border border-[joordak-soft] bg-white p-6 sm:p-8">
                        <p className="whitespace-pre-line text-base leading-8 text-stone-700 sm:text-lg" itemProp="description">{description}</p>
                    </div>
                ) : (
                    <p className="mt-8 rounded-2xl border border-dashed border-[joordak-soft] bg-slate-50 p-6 text-center text-stone-500">
                        محتوای این صفحه هنوز توسط مدیر سایت تنظیم نشده است.
                    </p>
                )}
            </article>
        </StorefrontLayout>
    );
}
