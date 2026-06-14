import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import OtpResendButton from '@/Components/OtpResendButton';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { useOtpResendCooldown } from '@/hooks/useOtpResendCooldown';
import { registerUrl } from '@/lib/auth';
import StorefrontLayout from '@/Layouts/StorefrontLayout';
import type { LoginPageProps, PageProps } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { ChangeEvent, FormEvent } from 'react';

export default function Login({ status, pendingOtp }: PageProps<LoginPageProps>) {
    const { url } = usePage();
    const hasPendingOtp = Boolean(pendingOtp);
    const { secondsLeft, canResend, restart, reset } = useOtpResendCooldown(pendingOtp?.resendSecondsRemaining ?? 0);

    const sendForm = useForm({
        phone: pendingOtp?.phone ?? '',
        purpose: 'login',
    });

    const loginForm = useForm({
        phone: pendingOtp?.phone ?? '',
        otp: '',
        remember: false,
    });

    const sendOtp = (event?: FormEvent) => {
        event?.preventDefault();

        sendForm.post(route('otp.send'), {
            preserveScroll: true,
            onSuccess: () => {
                loginForm.setData('phone', sendForm.data.phone);
                restart();
            },
        });
    };

    const submitLogin = (event: FormEvent) => {
        event.preventDefault();

        loginForm.setData('phone', pendingOtp?.phone ?? sendForm.data.phone ?? loginForm.data.phone);

        loginForm.post(route('login'), {
            onFinish: () => loginForm.reset('otp'),
        });
    };

    const changePhone = () => {
        router.post(route('otp.cancel'), {}, {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                sendForm.reset();
                loginForm.reset();
            },
        });
    };

    return (
        <StorefrontLayout title="ورود" seo={{ noIndex: true }}>
            <Head title="ورود" />

            <div style={{ maxWidth: '400px', margin: '48px auto', padding: '0 24px' }}>
                <h1 className="text-3xl font-black mb-2">ورود</h1>
                <p className="mb-6 text-sm text-gray-600">با شماره موبایل و کد یکبار مصرف وارد شوید.</p>

                {status && <div className="mb-4 text-sm font-medium text-green-600">{status}</div>}

                {!hasPendingOtp ? (
                    <form onSubmit={sendOtp}>
                        <div>
                            <InputLabel htmlFor="phone" value="شماره موبایل" />
                            <TextInput
                                id="phone"
                                type="tel"
                                name="phone"
                                value={sendForm.data.phone}
                                className="mt-1 block w-full"
                                autoComplete="tel"
                                isFocused
                                placeholder="09123456789"
                                onChange={(e: ChangeEvent<HTMLInputElement>) => sendForm.setData('phone', e.target.value)}
                            />
                            <InputError message={sendForm.errors.phone} className="mt-2" />
                        </div>

                        <div className="mt-6 flex items-center justify-between">
                            <Link href={registerUrl(url)} className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none">
                                حساب کاربری ندارید؟ ثبت‌نام
                            </Link>

                            <PrimaryButton disabled={sendForm.processing}>دریافت کد</PrimaryButton>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={submitLogin}>
                        <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
                            کد تأیید به شماره {pendingOtp?.phone} ارسال شد.
                        </div>

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
                                value={loginForm.data.otp}
                                className="mt-1 block w-full text-center text-lg tracking-[0.35em]"
                                autoComplete="one-time-code"
                                isFocused
                                placeholder="123456"
                                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                    loginForm.setData('otp', e.target.value.replace(/\D/g, '').slice(0, 6))
                                }
                            />
                            <InputError message={loginForm.errors.otp} className="mt-2" />
                            <InputError message={loginForm.errors.phone} className="mt-2" />
                            <OtpResendButton
                                canResend={canResend}
                                secondsLeft={secondsLeft}
                                processing={sendForm.processing}
                                onResend={() => sendOtp()}
                            />
                        </div>

                        <div className="mt-4 block">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="remember"
                                    checked={loginForm.data.remember}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => loginForm.setData('remember', e.target.checked)}
                                    className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                                />
                                <span className="ms-2 text-sm text-gray-600">مرا به خاطر بسپار</span>
                            </label>
                        </div>

                        <div className="mt-6 flex items-center justify-between">
                            <button
                                type="button"
                                onClick={changePhone}
                                className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none"
                            >
                                تغییر شماره
                            </button>

                            <PrimaryButton disabled={loginForm.processing}>ورود</PrimaryButton>
                        </div>
                    </form>
                )}
            </div>
        </StorefrontLayout>
    );
}
