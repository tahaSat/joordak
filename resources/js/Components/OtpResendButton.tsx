import { OTP_RESEND_COOLDOWN_SECONDS } from '@/hooks/useOtpResendCooldown';

type OtpResendButtonProps = {
    canResend: boolean;
    secondsLeft: number;
    processing: boolean;
    onResend: () => void;
};

function formatCountdown(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export default function OtpResendButton({ canResend, secondsLeft, processing, onResend }: OtpResendButtonProps) {
    if (!canResend) {
        return (
            <p className="mt-3 text-sm text-gray-500">
                ارسال مجدد کد تا {formatCountdown(secondsLeft || OTP_RESEND_COOLDOWN_SECONDS)}
            </p>
        );
    }

    return (
        <button
            type="button"
            onClick={onResend}
            disabled={processing}
            className="mt-3 text-sm text-indigo-600 underline hover:text-indigo-800 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
            {processing ? 'در حال ارسال...' : 'ارسال مجدد کد'}
        </button>
    );
}
