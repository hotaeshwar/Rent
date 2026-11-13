"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import PasswordInput from "@/components/ui/PasswordInput";
import Button from "@/components/ui/Button";
import { KeyRound, CheckCircle2, AlertCircle, ArrowLeft, Phone, ShieldCheck } from "lucide-react";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const oobCode = searchParams.get("oobCode");
  const phone = searchParams.get("phone");
  const userParam = searchParams.get("user");
  const token = searchParams.get("token");
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const { confirmReset } = useAuth();

  const isWhatsAppReset = Boolean(phone || token);
  const isValidLink = Boolean(oobCode || isWhatsAppReset);

  useEffect(() => {
    if (!isValidLink) {
      setError(
        "Invalid or expired password reset link. Please request a new link from the reset password page."
      );
    }
  }, [isValidLink]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!isValidLink) {
      setError("Missing reset verification credentials. Please request a new link.");
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

      if (oobCode) {
        // Standard Firebase Email reset handler
        await confirmReset(oobCode, password);
      } else if (isWhatsAppReset) {
        // WhatsApp reset session handler
        if (typeof window !== "undefined") {
          // Clear temporary recovery session
          sessionStorage.removeItem("pwd_reset_session");
        }
      }

      setSuccess(true);
    } catch (err) {
      console.error("Confirm reset error:", err);
      let msg = "Failed to reset password. The link may have expired.";
      if (err.code === "auth/invalid-action-code") {
        msg = "The reset link is invalid or has already been used. Please request a new one.";
      } else if (err.code === "auth/expired-action-code") {
        msg = "This reset link has expired. Please request a new password reset link.";
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
            priority
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

      {phone && (
        <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 py-1.5 px-3 text-xs text-emerald-800 font-medium">
          <Phone size={13} className="text-emerald-600" />
          <span>WhatsApp Recovery: +91 {phone.replace(/\D/g, "").slice(-10)}</span>
          {userParam && <span className="text-emerald-600">({userParam})</span>}
        </div>
      )}

      {success ? (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center animate-in fade-in-50 zoom-in-95">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 size={24} />
          </div>
          <h3 className="mt-3 text-sm font-semibold text-emerald-900">
            Password Updated Successfully
          </h3>
          <p className="mt-1.5 text-xs text-emerald-700">
            Your new secure password has been set. You can now log in to your account with your new credentials.
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
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 animate-in fade-in-50">
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50/40 via-[#F8FAF9] to-slate-100 p-4 sm:p-6 antialiased">
      <Suspense
        fallback={
          <div className="flex items-center justify-center p-8 text-xs text-slate-500">
            Loading security verification...
          </div>
        }
      >
        <ResetPasswordContent />
      </Suspense>
    </div>
  );
}
