import { SITE_LOGO_URL } from '@/Components/ApplicationLogo';
import StorefrontLayout from '@/Layouts/StorefrontLayout';

interface BlogPost {
    id: number;
    title: string;
    excerpt: string | null;
    content: string;
    image_url: string | null;
    published_at: string | null;
    author?: { name: string } | null;
}

interface BlogIndexProps {
    posts: {
        data: BlogPost[];
    };
}

export default function BlogIndex({ posts }: BlogIndexProps) {
    return (
        <StorefrontLayout
            title="وبلاگ"
            seo={{
                description: 'مطالب وبلاگ Joordak درباره زیورآلات، پیرسینگ، استایل و تازه‌های فروشگاه.',
                type: 'article',
            }}
        >
            <h1 className="text-3xl font-black">وبلاگ</h1>
            <p className="mt-2 text-stone-600">اخبار، آموزش‌ها و داستان‌های محصولات</p>

            <div className="mt-6 space-y-4">
                {posts.data.map((post) => (
                    <article key={post.id} className="overflow-hidden rounded-xl border border-[joordak-soft] bg-white p-5">
                        <img
                            src={post.image_url ?? SITE_LOGO_URL}
                            alt={post.title}
                            loading="lazy"
                            decoding="async"
                            className="mb-4 h-56 w-full rounded-lg object-cover"
                        />
                        <h2 className="text-xl font-bold text-joordak-coral">{post.title}</h2>
                        <p className="mt-1 text-xs uppercase tracking-wider text-stone-500">
                            {post.author?.name ?? 'تیم'} • {post.published_at ? new Date(post.published_at).toLocaleDateString('fa-IR') : 'پیش‌نویس'}
                        </p>
                        <p className="mt-3 whitespace-pre-line text-stone-700">{post.excerpt ?? post.content}</p>
                    </article>
                ))}
            </div>
        </StorefrontLayout>
    );
}
