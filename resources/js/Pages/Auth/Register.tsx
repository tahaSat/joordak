import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import StorefrontLayout from '@/Layouts/StorefrontLayout';
import type { PageProps, RegisterPageProps } from '@/types';
import { Link, useForm } from '@inertiajs/react';
import { ChangeEvent, FormEvent, useEffect, useState } from 'react';

export default function Register({ otpSent }: PageProps<RegisterPageProps>) {
    const [codeSent, setCodeSent] = useState(Boolean(otpSent));

    const sendForm = useForm({
        phone: '',
        purpose: 'register',
    });

    const registerForm = useForm({
        name: '',
        phone: '',
        otp: '',
    });

    useEffect(() => {
        if (otpSent) {
            setCodeSent(true);
            registerForm.setData('phone', sendForm.data.phone);
        }
    }, [otpSent]);

    const sendOtp = (event: FormEvent) => {
        event.preventDefault();

        sendForm.post(route('otp.send'), {
            preserveScroll: true,
            onSuccess: () => {
                setCodeSent(true);
                registerForm.setData('phone', sendForm.data.phone);
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
        setCodeSent(false);
        registerForm.reset('otp');
    };

    return (
        <StorefrontLayout title="ثبت‌نام" seo={{ noIndex: true }}>
            <div style={{ maxWidth: '400px', margin: '48px auto', padding: '0 24px' }}>
                <h1 className="text-3xl font-black mb-2">ثبت‌نام</h1>
                <p className="mb-6 text-sm text-joordak-foreground">با شماره موبایل و کد یکبار مصرف حساب بسازید.</p>

                {!codeSent ? (
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
                            <Link href={route('login')} className="rounded-md text-sm text-joordak-foreground underline hover:text-joordak-foreground focus:outline-none">
                                قبلاً ثبت‌نام کرده‌اید؟ ورود
                            </Link>

                            <PrimaryButton disabled={sendForm.processing || !registerForm.data.name.trim()}>دریافت کد</PrimaryButton>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={submitRegister}>
                        <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-joordak-foreground">
                            کد تأیید به شماره {registerForm.data.phone || sendForm.data.phone} ارسال شد.
                        </div>

                        <input type="hidden" name="name" value={registerForm.data.name} />
                        <input type="hidden" name="phone" value={registerForm.data.phone || sendForm.data.phone} />

                        <div>
                            <InputLabel htmlFor="otp" value="کد تأیید" />
                            <TextInput
                                id="otp"
                                type="text"
                                name="otp"
                                inputMode="numeric"
                                maxLength={6}
                                value={registerForm.data.otp}
                                className="mt-1 block w-full tracking-[0.35em]"
                                autoComplete="one-time-code"
                                isFocused
                                placeholder="123456"
                                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                    registerForm.setData('otp', e.target.value.replace(/\D/g, '').slice(0, 6))
                                }
                            />
                            <InputError message={registerForm.errors.otp} className="mt-2" />
                            <InputError message={registerForm.errors.phone} className="mt-2" />
                        </div>

                        <div className="mt-6 flex items-center justify-between">
                            <button
                                type="button"
                                onClick={changePhone}
                                className="rounded-md text-sm text-joordak-foreground underline hover:text-joordak-foreground focus:outline-none"
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
