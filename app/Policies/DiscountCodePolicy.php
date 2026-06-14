<?php

namespace App\Policies;

use App\Models\DiscountCode;
use App\Models\User;

class DiscountCodePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdmin();
    }

    public function view(User $user, DiscountCode $discountCode): bool
    {
        return $user->isAdmin();
    }

    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    public function update(User $user, DiscountCode $discountCode): bool
    {
        return $user->isAdmin();
    }

    public function delete(User $user, DiscountCode $discountCode): bool
    {
        return $user->isAdmin();
    }
}
