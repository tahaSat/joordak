<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\IranProvince;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', User::class);

        $filters = $request->only(['search', 'role']);

        $users = User::query()
            ->when($filters['search'] ?? null, function (Builder $query, string $search): void {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('surname', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            })
            ->when($filters['role'] ?? null, fn (Builder $query, string $role): Builder => $query->where('role', $role))
            ->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(fn (User $user): array => $this->serialize($user));

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'filters' => $filters,
            'roles' => ['admin' => 'ادمین', 'customer' => 'مشتری'],
        ]);
    }

    public function create(): Response
    {
        Gate::authorize('create', User::class);

        return Inertia::render('Admin/Users/Form', [
            'managedUser' => null,
            'roles' => ['admin' => 'ادمین', 'customer' => 'مشتری'],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('create', User::class);

        User::query()->create($this->validated($request));

        return redirect()->route('admin.users.index')->with('status', 'کاربر ساخته شد.');
    }

    public function edit(User $user): Response
    {
        Gate::authorize('update', $user);

        return Inertia::render('Admin/Users/Form', [
            'managedUser' => $this->serialize($user),
            'roles' => ['admin' => 'ادمین', 'customer' => 'مشتری'],
        ]);
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        Gate::authorize('update', $user);

        $user->update($this->validated($request, $user));

        return redirect()->route('admin.users.edit', $user)->with('status', 'کاربر به‌روزرسانی شد.');
    }

    public function destroy(User $user): RedirectResponse
    {
        Gate::authorize('delete', $user);

        $user->delete();

        return redirect()->route('admin.users.index')->with('status', 'کاربر حذف شد.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?User $user = null): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'surname' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user)],
            'phone' => ['required', 'string', 'max:255', Rule::unique('users', 'phone')->ignore($user)],
            'address' => ['nullable', 'string'],
            'address_province' => ['nullable', 'string', Rule::in(IranProvince::all())],
            'postal_code' => ['nullable', 'string', 'max:255'],
            'role' => ['required', Rule::in(['admin', 'customer'])],
            'email_verified_at' => ['nullable', 'date'],
            'password' => [$user ? 'nullable' : 'required', 'string', 'min:8'],
        ]);

        if (filled($data['password'] ?? null)) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        return $data;
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'surname' => $user->surname,
            'email' => $user->email,
            'phone' => $user->phone,
            'address' => $user->address,
            'address_province' => $user->address_province,
            'postal_code' => $user->postal_code,
            'role' => $user->role,
            'email_verified_at' => $user->email_verified_at?->format('Y-m-d\TH:i'),
            'created_at' => $user->created_at?->toISOString(),
        ];
    }
}
