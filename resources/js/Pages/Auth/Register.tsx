import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import OtpResendButton from '@/Components/OtpResendButton';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { useOtpResendCooldown } from '@/hooks/useOtpResendCooldown';
import { loginUrl } from '@/lib/auth';
import StorefrontLayout from '@/Layouts/StorefrontLayout';
import type { PageProps, RegisterPageProps } from '@/types';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import { ChangeEvent, FormEvent } from 'react';

export default function Register({ pendingOtp }: PageProps<RegisterPageProps>) {
    const { url } = usePage();
    const hasPendingOtp = Boolean(pendingOtp);
    const { secondsLeft, canResend, restart, reset } = useOtpResendCooldown(pendingOtp?.resendSecondsRemaining ?? 0);

    const sendForm = useForm({
        phone: pendingOtp?.phone ?? '',
        purpose: 'register',
        name: pendingOtp?.name ?? '',
    });

    const registerForm = useForm({
        name: pendingOtp?.name ?? '',
        phone: pendingOtp?.phone ?? '',
        otp: '',
    });

    const sendOtp = (event?: FormEvent) => {
        event?.preventDefault();

        sendForm.setData('name', registerForm.data.name.trim());

        sendForm.post(route('otp.send'), {
            preserveScroll: true,
            onSuccess: () => {
                registerForm.setData({
                    name: sendForm.data.name,
                    phone: sendForm.data.phone,
                });
                restart();
            },
        });
    };

    const submitRegister = (event: FormEvent) => {
        event.preventDefault();

        registerForm.post(route('register'), {
            onFinish: () => registerForm.reset('otp'),
        });
    };

    const changePhone = () => {
        router.post(route('otp.cancel'), {}, {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                sendForm.reset();
                registerForm.reset();
            },
        });
    };

    return (
        <StorefrontLayout title="ثبت‌نام" seo={{ noIndex: true }}>
            <div style={{ maxWidth: '400px', margin: '48px auto', padding: '0 24px' }}>
                <h1 className="text-3xl font-black mb-2">ثبت‌نام</h1>
                <p className="mb-6 text-sm text-gray-600">با شماره موبایل و کد یکبار مصرف حساب بسازید.</p>

                {!hasPendingOtp ? (
                    <form onSubmit={sendOtp}>
                        <div>
                            <InputLabel htmlFor="name" value="نام" />
                            <TextInput
                                id="name"
                                name="name"
                                value={registerForm.data.name}
                                className="mt-1 block w-full"
                                autoComplete="name"
                                isFocused
                                onChange={(e: ChangeEvent<HTMLInputElement>) => registerForm.setData('name', e.target.value)}
                            />
                            <InputError message={registerForm.errors.name} className="mt-2" />
                        </div>

                        <div className="mt-4">
                            <InputLabel htmlFor="phone" value="شماره موبایل" />
                            <TextInput
                                id="phone"
                                type="tel"
                                name="phone"
                                value={sendForm.data.phone}
                                className="mt-1 block w-full"
                                autoComplete="tel"
                                placeholder="09123456789"
                                onChange={(e: ChangeEvent<HTMLInputElement>) => sendForm.setData('phone', e.target.value)}
                            />
                            <InputError message={sendForm.errors.phone} className="mt-2" />
                        </div>

                        <div className="mt-6 flex items-center justify-between">
                            <Link href={loginUrl(url)} className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none">
                                قبلاً ثبت‌نام کرده‌اید؟ ورود
                            </Link>

                            <PrimaryButton disabled={sendForm.processing || !registerForm.data.name.trim()}>دریافت کد</PrimaryButton>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={submitRegister}>
                        <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
                            کد تأیید به شماره {pendingOtp?.phone} ارسال شد.
                        </div>

                        <input type="hidden" name="name" value={registerForm.data.name} />
                        <input type="hidden" name="phone" value={registerForm.data.phone} />

                        <div>
                            <InputLabel htmlFor="otp" value="کد تأیید" />
                            <TextInput
                                id="otp"
                                type="tel"
                                name="otp"
                                inputMode="numeric"
                                pattern="[0-9]{6}"
                                minLength={6}
                                maxLength={6}
                                required
                                value={registerForm.data.otp}
                                className="mt-1 block w-full text-center text-lg tracking-[0.35em]"
                                autoComplete="one-time-code"
                                isFocused
                                placeholder="123456"
                                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                    registerForm.setData('otp', e.target.value.replace(/\D/g, '').slice(0, 6))
                                }
                            />
                            <InputError message={registerForm.errors.otp} className="mt-2" />
                            <InputError message={registerForm.errors.phone} className="mt-2" />
                            <OtpResendButton
                                canResend={canResend}
                                secondsLeft={secondsLeft}
                                processing={sendForm.processing}
                                onResend={() => sendOtp()}
                            />
                        </div>

                        <div className="mt-6 flex items-center justify-between">
                            <button
                                type="button"
                                onClick={changePhone}
                                className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none"
                            >
                                تغییر شماره
                            </button>

                            <PrimaryButton disabled={registerForm.processing}>ثبت‌نام</PrimaryButton>
                        </div>
                    </form>
                )}
            </div>
        </StorefrontLayout>
    );
}
