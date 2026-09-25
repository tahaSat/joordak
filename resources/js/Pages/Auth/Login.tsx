import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import OtpResendButton from '@/Components/OtpResendButton';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { useOtpResendCooldown } from '@/hooks/useOtpResendCooldown';
import { normalizeDigits } from '@/lib/digits';
import StorefrontLayout from '@/Layouts/StorefrontLayout';
import type { LoginPageProps, PageProps } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { ChangeEvent, FormEvent } from 'react';

export default function Login({ status, pendingOtp }: PageProps<LoginPageProps>) {
    const hasPendingOtp = Boolean(pendingOtp);
    const isRegister = pendingOtp?.purpose === 'register';
    const { secondsLeft, canResend, restart, reset } = useOtpResendCooldown(pendingOtp?.resendSecondsRemaining ?? 0);

    const sendForm = useForm({
        phone: pendingOtp?.phone ?? '',
    });

    const loginForm = useForm({
        phone: pendingOtp?.phone ?? '',
        otp: '',
        remember: false,
    });

    const registerForm = useForm({
        name: '',
        surname: '',
        phone: pendingOtp?.phone ?? '',
        otp: '',
    });

    const sendOtp = (event?: FormEvent) => {
        event?.preventDefault();

        sendForm.post(route('otp.send'), {
            preserveScroll: true,
            onSuccess: () => {
                loginForm.setData('phone', sendForm.data.phone);
                registerForm.setData('phone', sendForm.data.phone);
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

    const submitRegister = (event: FormEvent) => {
        event.preventDefault();

        registerForm.setData('phone', pendingOtp?.phone ?? sendForm.data.phone ?? registerForm.data.phone);

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
                loginForm.reset();
                registerForm.reset();
            },
        });
    };

    const registerSubmitDisabled =
        registerForm.processing ||
        !registerForm.data.name.trim() ||
        !registerForm.data.surname.trim() ||
        registerForm.data.otp.length !== 6;

    const pageTitle = isRegister ? 'ثبت‌نام' : 'ورود';
    const pageSubtitle = isRegister
        ? 'کد تأیید را وارد کنید و نام خود را تکمیل کنید.'
        : 'با شماره موبایل و کد یکبار مصرف وارد شوید.';

    return (
        <StorefrontLayout title={pageTitle} seo={{ noIndex: true }}>
            <Head title={pageTitle} />

            <div style={{ maxWidth: '400px', margin: '48px auto', padding: '0 24px' }}>
                <h1 className="text-3xl font-black mb-2">{pageTitle}</h1>
                <p className="mb-6 text-sm text-gray-600">{pageSubtitle}</p>

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
                                onChange={(e: ChangeEvent<HTMLInputElement>) => sendForm.setData('phone', normalizeDigits(e.target.value))}
                            />
                            <InputError message={sendForm.errors.phone} className="mt-2" />
                        </div>

                        <div className="mt-6 flex justify-end">
                            <PrimaryButton className="w-full sm:w-auto" disabled={sendForm.processing}>دریافت کد</PrimaryButton>
                        </div>
                    </form>
                ) : isRegister ? (
                    <form onSubmit={submitRegister}>
                        <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
                            کد تأیید به شماره {pendingOtp?.phone} ارسال شد.
                        </div>

                        <div>
                            <InputLabel htmlFor="name" value="نام" />
                            <TextInput
                                id="name"
                                type="text"
                                name="name"
                                value={registerForm.data.name}
                                className="mt-1 block w-full"
                                autoComplete="given-name"
                                isFocused
                                onChange={(e: ChangeEvent<HTMLInputElement>) => registerForm.setData('name', e.target.value)}
                            />
                            <InputError message={registerForm.errors.name} className="mt-2" />
                        </div>

                        <div className="mt-4">
                            <InputLabel htmlFor="surname" value="نام خانوادگی" />
                            <TextInput
                                id="surname"
                                type="text"
                                name="surname"
                                value={registerForm.data.surname}
                                className="mt-1 block w-full"
                                autoComplete="family-name"
                                onChange={(e: ChangeEvent<HTMLInputElement>) => registerForm.setData('surname', e.target.value)}
                            />
                            <InputError message={registerForm.errors.surname} className="mt-2" />
                        </div>

                        <div className="mt-4">
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
                                placeholder="123456"
                                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                    registerForm.setData('otp', normalizeDigits(e.target.value).slice(0, 6))
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

                            <PrimaryButton disabled={registerSubmitDisabled}>ثبت‌نام</PrimaryButton>
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
                                    loginForm.setData('otp', normalizeDigits(e.target.value).slice(0, 6))
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
