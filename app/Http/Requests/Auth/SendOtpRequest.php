<?php

namespace App\Http\Requests\Auth;

use App\Models\User;
use App\Support\PhoneNumber;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class SendOtpRequest extends FormRequest
{
    private ?string $resolvedPurpose = null;

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'phone' => ['required', 'string', 'max:20'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $phone = PhoneNumber::normalize((string) $this->input('phone'));

            if (! PhoneNumber::isValid($phone)) {
                $validator->errors()->add('phone', 'شماره موبایل معتبر نیست.');

                return;
            }

            $userExists = User::query()->where('phone', $phone)->exists();

            $this->resolvedPurpose = $userExists ? 'login' : 'register';
        });
    }

    public function normalizedPhone(): string
    {
        return PhoneNumber::normalize((string) $this->input('phone'));
    }

    public function purpose(): string
    {
        if ($this->resolvedPurpose !== null) {
            return $this->resolvedPurpose;
        }

        $phone = $this->normalizedPhone();
        $userExists = User::query()->where('phone', $phone)->exists();

        return $userExists ? 'login' : 'register';
    }
}
