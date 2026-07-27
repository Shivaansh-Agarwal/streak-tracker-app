"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import EmailForm from "./email-form";
import OtpForm from "./otp-form";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendOtp(): Promise<boolean> {
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
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(otp: string) {
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

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-md border border-border p-8">
        <h1 className="mb-6 text-center text-2xl font-semibold">Sign in</h1>
        {step === "email" ? (
          <EmailForm
            email={email}
            onChange={setEmail}
            error={error}
            loading={loading}
            onSubmit={sendOtp}
          />
        ) : (
          <OtpForm
            email={email}
            error={error}
            loading={loading}
            onVerify={verifyOtp}
            onResend={sendOtp}
          />
        )}
      </div>
    </div>
  );
}
