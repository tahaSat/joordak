import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const submit = (event) => {
        event.preventDefault();

        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="تأیید رمز عبور">
                <meta head-key="robots" name="robots" content="noindex, nofollow" />
            </Head>

            <div className="mb-4 text-sm text-joordak-foreground">Confirm your password before continuing.</div>

            <form onSubmit={submit}>
                <div>
                    <InputLabel htmlFor="password" value="Password" />
                    <TextInput id="password" type="password" name="password" value={data.password} className="mt-1 block w-full" isFocused onChange={(e) => setData('password', e.target.value)} />
                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="mt-4 flex justify-end">
                    <PrimaryButton disabled={processing}>Confirm</PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
