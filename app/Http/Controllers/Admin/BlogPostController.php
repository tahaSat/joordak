<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BlogPost;
use App\Models\User;
use App\Support\LiaraUrl;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class BlogPostController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', BlogPost::class);

        $filters = $request->only(['search']);

        $posts = BlogPost::query()
            ->with('author')
            ->when($filters['search'] ?? null, function (Builder $query, string $search): void {
                $query->where('title', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%")
                    ->orWhere('excerpt', 'like', "%{$search}%");
            })
            ->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(fn (BlogPost $post): array => $this->serialize($post));

        return Inertia::render('Admin/BlogPosts/Index', [
            'posts' => $posts,
            'filters' => $filters,
        ]);
    }

    public function create(): Response
    {
        Gate::authorize('create', BlogPost::class);

        return Inertia::render('Admin/BlogPosts/Form', [
            'post' => null,
            'authors' => $this->authorOptions(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('create', BlogPost::class);

        $data = $this->validated($request);
        $data['image_url'] = $request->file('image')?->store('blog', 'liara');

        BlogPost::query()->create($data);

        return redirect()->route('admin.blog-posts.index')->with('status', 'مطلب ساخته شد.');
    }

    public function edit(BlogPost $blogPost): Response
    {
        Gate::authorize('update', $blogPost);
        $blogPost->load('author');

        return Inertia::render('Admin/BlogPosts/Form', [
            'post' => $this->serialize($blogPost),
            'authors' => $this->authorOptions(),
        ]);
    }

    public function update(Request $request, BlogPost $blogPost): RedirectResponse
    {
        Gate::authorize('update', $blogPost);

        $data = $this->validated($request, $blogPost);

        if ($request->hasFile('image')) {
            $data['image_url'] = $request->file('image')->store('blog', 'liara');
        }

        $blogPost->update($data);

        return redirect()->route('admin.blog-posts.edit', $blogPost)->with('status', 'مطلب به‌روزرسانی شد.');
    }

    public function destroy(BlogPost $blogPost): RedirectResponse
    {
        Gate::authorize('delete', $blogPost);

        $blogPost->delete();

        return redirect()->route('admin.blog-posts.index')->with('status', 'مطلب حذف شد.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?BlogPost $blogPost = null): array
    {
        $data = $request->validate([
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', Rule::unique('blog_posts', 'slug')->ignore($blogPost)],
            'excerpt' => ['nullable', 'string', 'max:255'],
            'content' => ['required', 'string'],
            'is_published' => ['required', 'boolean'],
            'published_at' => ['nullable', 'date'],
            'image' => ['nullable', 'image', 'max:5120'],
        ]);

        unset($data['image']);

        $data['is_published'] = $request->boolean('is_published');

        return $data;
    }

    /**
     * @return array<int, array{id: int, name: string}>
     */
    private function authorOptions(): array
    {
        return User::query()
            ->orderBy('name')
            ->get(['id', 'name', 'surname'])
            ->map(fn (User $user): array => [
                'id' => $user->id,
                'name' => trim($user->name.' '.($user->surname ?? '')),
            ])
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(BlogPost $post): array
    {
        return [
            'id' => $post->id,
            'user_id' => $post->user_id,
            'author_name' => $post->author ? trim($post->author->name.' '.($post->author->surname ?? '')) : null,
            'title' => $post->title,
            'slug' => $post->slug,
            'excerpt' => $post->excerpt,
            'content' => $post->content,
            'image_url' => $post->image_url,
            'image_preview_url' => LiaraUrl::fromPath($post->image_url),
            'is_published' => $post->is_published,
            'published_at' => $post->published_at?->format('Y-m-d\TH:i'),
            'created_at' => $post->created_at?->toISOString(),
        ];
    }
}
