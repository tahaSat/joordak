<?php

namespace App\Policies;

use App\Models\BlogPost;
use App\Models\User;

class BlogPostPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdmin();
    }

    public function view(User $user, BlogPost $blogPost): bool
    {
        return $user->isAdmin();
    }

    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    public function update(User $user, BlogPost $blogPost): bool
    {
        return $user->isAdmin();
    }

    public function delete(User $user, BlogPost $blogPost): bool
    {
        return $user->isAdmin();
    }
}
