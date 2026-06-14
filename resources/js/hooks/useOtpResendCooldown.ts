import { useCallback, useEffect, useState } from 'react';

export const OTP_RESEND_COOLDOWN_SECONDS = 120;

export function useOtpResendCooldown(initialSecondsLeft = 0) {
    const [secondsLeft, setSecondsLeft] = useState(Math.max(0, initialSecondsLeft));

    useEffect(() => {
        setSecondsLeft(Math.max(0, initialSecondsLeft));
    }, [initialSecondsLeft]);

    const restart = useCallback(() => {
        setSecondsLeft(OTP_RESEND_COOLDOWN_SECONDS);
    }, []);

    const reset = useCallback(() => {
        setSecondsLeft(0);
    }, []);

    useEffect(() => {
        if (secondsLeft <= 0) {
            return;
        }

        const timer = window.setTimeout(() => {
            setSecondsLeft((current) => Math.max(0, current - 1));
        }, 1000);

        return () => window.clearTimeout(timer);
    }, [secondsLeft]);

    return {
        secondsLeft,
        canResend: secondsLeft === 0,
        restart,
        reset,
    };
}
