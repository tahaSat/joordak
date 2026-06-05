import PrimaryButton from '@/Components/PrimaryButton';
import GuestLayout from '@/Layouts/GuestLayout';
import type { PageProps, VerifyEmailPageProps } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

export default function VerifyEmail({ status }: PageProps<VerifyEmailPageProps>) {
    const { post, processing } = useForm({});

    const submit = (event: FormEvent) => {
        event.preventDefault();
        post(route('verification.send'));
    };

    return (
        <GuestLayout>
            <Head title="تأیید ایمیل">
                <meta head-key="robots" name="robots" content="noindex, nofollow" />
            </Head>

            <div className="mb-4 text-sm text-joordak-foreground">
                Please verify your email by clicking the link we sent to your inbox.
            </div>

            {status === 'verification-link-sent' && (
                <div className="mb-4 text-sm font-medium text-joordak-foreground">
                    A new verification link has been sent.
                </div>
            )}

            <form onSubmit={submit}>
                <div className="mt-4 flex items-center justify-between">
                    <PrimaryButton disabled={processing}>Resend Verification Email</PrimaryButton>

                    <Link href={route('logout')} method="post" as="button" className="rounded-md text-sm text-joordak-foreground underline hover:text-joordak-foreground">
                        Log Out
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
