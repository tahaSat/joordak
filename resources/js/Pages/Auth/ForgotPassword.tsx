import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (event) => {
        event.preventDefault();
        post(route('password.email'));
    };

    return (
        <GuestLayout>
            <Head title="بازیابی رمز عبور">
                <meta head-key="robots" name="robots" content="noindex, nofollow" />
            </Head>

            <div className="mb-4 text-sm text-joordak-foreground">
                Forgot your password? Enter your email and we will send a reset link.
            </div>

            {status && <div className="mb-4 text-sm font-medium text-joordak-foreground">{status}</div>}

            <form onSubmit={submit}>
                <div>
                    <InputLabel htmlFor="email" value="Email" />
                    <TextInput id="email" type="email" name="email" value={data.email} className="mt-1 block w-full" isFocused onChange={(e) => setData('email', e.target.value)} />
                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div className="mt-4 flex items-center justify-end">
                    <PrimaryButton disabled={processing}>Email Password Reset Link</PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
