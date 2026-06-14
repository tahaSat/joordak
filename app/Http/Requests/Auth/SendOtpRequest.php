<?php

namespace App\Http\Requests\Auth;

use App\Models\User;
use App\Support\PhoneNumber;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class SendOtpRequest extends FormRequest
{
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
            'purpose' => ['required', 'string', Rule::in(['login', 'register'])],
            'name' => ['required_if:purpose,register', 'nullable', 'string', 'max:255'],
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

            if ($this->input('purpose') === 'login' && ! $userExists) {
                $validator->errors()->add('phone', 'کاربری با این شماره موبایل یافت نشد.');
            }

            if ($this->input('purpose') === 'register' && $userExists) {
                $validator->errors()->add('phone', 'این شماره موبایل قبلاً ثبت شده است.');
            }
        });
    }

    public function normalizedPhone(): string
    {
        return PhoneNumber::normalize((string) $this->input('phone'));
    }
}
