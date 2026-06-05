<?php

namespace App\Http\Controllers;

use App\Models\BlogPost;
use App\Support\LiaraUrl;
use Inertia\Inertia;
use Inertia\Response;

class BlogController extends Controller
{
    public function index(): Response
    {
        $posts = BlogPost::query()
            ->with('author:id,name')
            ->published()
            ->latest('published_at')
            ->paginate(10)
            ->withQueryString();

        $posts->through(function (BlogPost $post) {
            if ($post->image_url) {
                $post->image_url = LiaraUrl::fromPath($post->image_url);
            }

            return $post;
        });

        return Inertia::render('Blog/Index', [
            'posts' => $posts,
        ]);
    }
}
