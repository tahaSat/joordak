import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import StorefrontLayout from '@/Layouts/StorefrontLayout';
import type { LoginPageProps, PageProps } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ChangeEvent, FormEvent, useEffect, useState } from 'react';

export default function Login({ status, otpSent }: PageProps<LoginPageProps>) {
    const [codeSent, setCodeSent] = useState(Boolean(otpSent));

    const sendForm = useForm({
        phone: '',
        purpose: 'login',
    });

    const loginForm = useForm({
        phone: '',
        otp: '',
        remember: false,
    });

    useEffect(() => {
        if (otpSent) {
            setCodeSent(true);
            loginForm.setData('phone', sendForm.data.phone);
        }
    }, [otpSent]);

    const sendOtp = (event: FormEvent) => {
        event.preventDefault();

        sendForm.post(route('otp.send'), {
            preserveScroll: true,
            onSuccess: () => {
                setCodeSent(true);
                loginForm.setData('phone', sendForm.data.phone);
            },
        });
    };

    const submitLogin = (event: FormEvent) => {
        event.preventDefault();

        loginForm.post(route('login'), {
            onFinish: () => loginForm.reset('otp'),
        });
    };

    const changePhone = () => {
        setCodeSent(false);
        loginForm.reset('otp');
    };

    return (
        <StorefrontLayout title="ورود" seo={{ noIndex: true }}>
            <Head title="ورود" />

            <div style={{ maxWidth: '400px', margin: '48px auto', padding: '0 24px' }}>
                <h1 className="text-3xl font-black mb-2">ورود</h1>
                <p className="mb-6 text-sm text-joordak-foreground">با شماره موبایل و کد یکبار مصرف وارد شوید.</p>

                {status && <div className="mb-4 text-sm font-medium text-joordak-foreground">{status}</div>}

                {!codeSent ? (
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
                            <Link href={route('register')} className="rounded-md text-sm text-joordak-foreground underline hover:text-joordak-foreground focus:outline-none">
                                حساب کاربری ندارید؟ ثبت‌نام
                            </Link>

                            <PrimaryButton disabled={sendForm.processing}>دریافت کد</PrimaryButton>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={submitLogin}>
                        <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-joordak-foreground">
                            کد تأیید به شماره {loginForm.data.phone || sendForm.data.phone} ارسال شد.
                        </div>

                        <div>
                            <InputLabel htmlFor="otp" value="کد تأیید" />
                            <TextInput
                                id="otp"
                                type="text"
                                name="otp"
                                inputMode="numeric"
                                maxLength={6}
                                value={loginForm.data.otp}
                                className="mt-1 block w-full tracking-[0.35em]"
                                autoComplete="one-time-code"
                                isFocused
                                placeholder="123456"
                                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                    loginForm.setData('otp', e.target.value.replace(/\D/g, '').slice(0, 6))
                                }
                            />
                            <InputError message={loginForm.errors.otp} className="mt-2" />
                            <InputError message={loginForm.errors.phone} className="mt-2" />
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
                                <span className="ms-2 text-sm text-joordak-foreground">مرا به خاطر بسپار</span>
                            </label>
                        </div>

                        <div className="mt-6 flex items-center justify-between">
                            <button
                                type="button"
                                onClick={changePhone}
                                className="rounded-md text-sm text-joordak-foreground underline hover:text-joordak-foreground focus:outline-none"
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
