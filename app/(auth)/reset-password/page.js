"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import PasswordInput from "@/components/ui/PasswordInput";
import Button from "@/components/ui/Button";
import { KeyRound, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const oobCode = searchParams.get("oobCode");
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const { confirmReset } = useAuth();

  useEffect(() => {
    if (!oobCode) {
      setError("Invalid or expired password reset link. Please request a new link.");
    }
  }, [oobCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!oobCode) {
      setError("Missing reset verification code.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      await confirmReset(oobCode, password);
      setSuccess(true);
    } catch (err) {
      console.error("Confirm reset error:", err);
      let msg = "Failed to reset password. The link may have expired.";
      if (err.code === "auth/invalid-action-code") {
        msg = "The reset link is invalid or has already been used. Please request a new one.";
      } else if (err.code === "auth/expired-action-code") {
        msg = "This reset link has expired. Please request a new password reset email.";
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xl">
      <div className="flex flex-col items-center text-center">
        <div className="flex items-center gap-3">
          <Image
            src="/images/bid-logo.png"
            alt="BiD Rent Manager"
            width={46}
            height={46}
            className="h-11 w-11 object-contain"
          />
          <span className="font-bold tracking-tight text-xl text-emerald-950">
            BiD Rent Manager
          </span>
        </div>

        <h2 className="mt-4 text-xl font-bold text-slate-800">
          Create New Password
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Enter and confirm your new secure password below
        </p>
      </div>

      {success ? (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 size={24} />
          </div>
          <h3 className="mt-3 text-sm font-semibold text-emerald-900">
            Password Reset Successfully
          </h3>
          <p className="mt-1.5 text-xs text-emerald-700">
            Your password has been securely updated. You can now log in with your new credentials.
          </p>
          <div className="mt-5">
            <Link
              href="/login"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800 transition-colors w-full"
            >
              Sign In Now
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <AlertCircle size={16} className="shrink-0 text-red-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <PasswordInput
            id="password"
            label="New Password"
            required
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <PasswordInput
            id="confirmPassword"
            label="Confirm New Password"
            required
            placeholder="Repeat new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <div className="pt-2">
            <Button
              type="submit"
              loading={loading}
              icon={KeyRound}
              className="w-full min-h-11 text-sm font-semibold"
            >
              Update Password
            </Button>
          </div>

          <div className="text-center pt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-emerald-700"
            >
              <ArrowLeft size={14} />
              Return to Login
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50/40 via-[#F8FAF9] to-slate-100 p-4 sm:p-6">
      <Suspense fallback={<div>Loading...</div>}>
        <ResetPasswordContent />
      </Suspense>
    </div>
  );
}

