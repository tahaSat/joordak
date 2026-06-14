<?php

namespace App\Http\Controllers\Admin;

use App\Enums\DiscountType;
use App\Http\Controllers\Controller;
use App\Models\DiscountCode;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;
use Inertia\Inertia;
use Inertia\Response;

class DiscountCodeController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', DiscountCode::class);

        $filters = $request->only(['search']);

        $discountCodes = DiscountCode::query()
            ->when($filters['search'] ?? null, function (Builder $query, string $search): void {
                $query->where('code', 'like', "%{$search}%");
            })
            ->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(fn (DiscountCode $discountCode): array => $this->serialize($discountCode));

        return Inertia::render('Admin/DiscountCodes/Index', [
            'discountCodes' => $discountCodes,
            'filters' => $filters,
            'typeLabels' => DiscountType::labelsFa(),
        ]);
    }

    public function create(): Response
    {
        Gate::authorize('create', DiscountCode::class);

        return Inertia::render('Admin/DiscountCodes/Form', [
            'discountCode' => null,
            'typeLabels' => DiscountType::labelsFa(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('create', DiscountCode::class);

        DiscountCode::query()->create($this->validated($request));

        return redirect()->route('admin.discount-codes.index')->with('status', 'کد تخفیف ساخته شد.');
    }

    public function edit(DiscountCode $discountCode): Response
    {
        Gate::authorize('update', $discountCode);

        return Inertia::render('Admin/DiscountCodes/Form', [
            'discountCode' => $this->serialize($discountCode),
            'typeLabels' => DiscountType::labelsFa(),
        ]);
    }

    public function update(Request $request, DiscountCode $discountCode): RedirectResponse
    {
        Gate::authorize('update', $discountCode);

        $discountCode->update($this->validated($request, $discountCode));

        return redirect()->route('admin.discount-codes.edit', $discountCode)->with('status', 'کد تخفیف به‌روزرسانی شد.');
    }

    public function destroy(DiscountCode $discountCode): RedirectResponse
    {
        Gate::authorize('delete', $discountCode);

        $discountCode->delete();

        return redirect()->route('admin.discount-codes.index')->with('status', 'کد تخفیف حذف شد.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?DiscountCode $discountCode = null): array
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:255', Rule::unique('discount_codes', 'code')->ignore($discountCode)],
            'type' => ['required', new Enum(DiscountType::class)],
            'value' => ['required', 'integer', 'min:1'],
            'max_discount' => ['nullable', 'integer', 'min:0'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'usage_limit' => ['nullable', 'integer', 'min:1'],
            'is_active' => ['required', 'boolean'],
        ]);

        if ($data['type'] === DiscountType::Percent->value) {
            $data['value'] = min(100, (int) $data['value']);
        } else {
            $data['max_discount'] = null;
        }

        $data['is_active'] = $request->boolean('is_active');

        return $data;
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(DiscountCode $discountCode): array
    {
        return [
            'id' => $discountCode->id,
            'code' => $discountCode->code,
            'type' => $discountCode->type->value,
            'value' => (int) $discountCode->value,
            'max_discount' => $discountCode->max_discount !== null ? (int) $discountCode->max_discount : null,
            'starts_at' => $discountCode->starts_at?->toISOString(),
            'ends_at' => $discountCode->ends_at?->toISOString(),
            'usage_limit' => $discountCode->usage_limit,
            'used_count' => $discountCode->used_count,
            'is_active' => $discountCode->is_active,
            'created_at' => $discountCode->created_at?->toISOString(),
        ];
    }
}
