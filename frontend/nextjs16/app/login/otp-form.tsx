"use client";

import { useEffect, useState } from "react";

const RESEND_COOLDOWN_SECONDS = 60;
const OTP_TTL_SECONDS = 10 * 60;

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function OtpForm({
  email,
  error,
  loading,
  onVerify,
  onResend,
}: {
  email: string;
  error: string;
  loading: boolean;
  onVerify: (otp: string) => void;
  onResend: () => Promise<boolean>;
}) {
  const [otp, setOtp] = useState("");
  const [resendSecondsLeft, setResendSecondsLeft] = useState(RESEND_COOLDOWN_SECONDS);
  const [expirySecondsLeft, setExpirySecondsLeft] = useState(OTP_TTL_SECONDS);

  // This component only ever mounts once the OTP has actually been sent, so
  // starting the countdown on mount (rather than reacting to a step prop)
  // keeps the timers fully self-contained here.
  useEffect(() => {
    const interval = setInterval(() => {
      setResendSecondsLeft((seconds) => Math.max(0, seconds - 1));
      setExpirySecondsLeft((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  async function handleResend() {
    // Only reset the countdown on a confirmed successful resend - if it
    // failed (e.g. rate-limited), leave the existing timer running rather
    // than masking the failure with a fresh cooldown.
    const success = await onResend();
    if (success) {
      setResendSecondsLeft(RESEND_COOLDOWN_SECONDS);
      setExpirySecondsLeft(OTP_TTL_SECONDS);
    }
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        onVerify(otp);
      }}
    >
      <p className="text-sm text-muted">
        We sent a 6-digit code to <span className="text-foreground">{email}</span>.
      </p>
      <label className="flex flex-col gap-1 text-sm">
        Code
        <input
          type="text"
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          required
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          className="rounded-md border border-border bg-transparent px-3 py-2 tracking-widest outline-none focus:border-accent"
        />
      </label>
      <p className="text-xs text-muted">
        {expirySecondsLeft > 0
          ? `Code expires in ${formatTime(expirySecondsLeft)}`
          : "Code expired, please resend"}
      </p>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-accent px-4 py-2 text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
      >
        {loading ? "Verifying..." : "Verify"}
      </button>
      <button
        type="button"
        disabled={resendSecondsLeft > 0 || loading}
        onClick={handleResend}
        className="text-sm text-accent disabled:cursor-not-allowed disabled:text-muted"
      >
        {resendSecondsLeft > 0 ? `Resend code (${resendSecondsLeft}s)` : "Resend code"}
      </button>
    </form>
  );
}
