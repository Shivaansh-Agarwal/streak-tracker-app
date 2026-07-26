"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const RESEND_COOLDOWN_SECONDS = 60;
const OTP_TTL_SECONDS = 10 * 60;

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendSecondsLeft, setResendSecondsLeft] = useState(0);
  const [expirySecondsLeft, setExpirySecondsLeft] = useState(0);

  useEffect(() => {
    if (step !== "otp") return;
    const interval = setInterval(() => {
      setResendSecondsLeft((seconds) => Math.max(0, seconds - 1));
      setExpirySecondsLeft((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  async function sendOtp() {
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.message ?? "Something went wrong");
      }
      setStep("otp");
      setResendSecondsLeft(RESEND_COOLDOWN_SECONDS);
      setExpirySecondsLeft(OTP_TTL_SECONDS);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.message ?? "Something went wrong");
      }
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function formatTime(totalSeconds: number) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-md border border-border p-8">
        <h1 className="mb-6 text-center text-2xl font-semibold">Sign in</h1>

        {step === "email" && (
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              sendOtp();
            }}
          >
            <label className="flex flex-col gap-1 text-sm">
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-md border border-border bg-transparent px-3 py-2 outline-none focus:border-accent"
              />
            </label>
            {error && <p className="text-sm text-red-700">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-accent px-4 py-2 text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
            >
              {loading ? "Sending code..." : "Send code"}
            </button>
          </form>
        )}

        {step === "otp" && (
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              verifyOtp();
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
              onClick={sendOtp}
              className="text-sm text-accent disabled:cursor-not-allowed disabled:text-muted"
            >
              {resendSecondsLeft > 0 ? `Resend code (${resendSecondsLeft}s)` : "Resend code"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
