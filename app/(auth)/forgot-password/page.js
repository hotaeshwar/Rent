"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { isUsernameRegistered } from "@/lib/usernameClient";
import Button from "@/components/ui/Button";
import {
  User,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Copy,
  KeyRound,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

export default function ForgotPasswordPage() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [resetData, setResetData] = useState(null); // { resetUrl, username }

  const { resetPassword } = useAuth();

  const handleGenerateResetLink = async (e) => {
    e.preventDefault();
    setError("");
    setCopied(false);

    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername) {
      setError("Please enter your username");
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!usernameRegex.test(cleanUsername)) {
      setError("Username must contain only letters, numbers, and underscores");
      return;
    }

    try {
      setLoading(true);

      // Verify that this username is actually registered in the database
      const check = await isUsernameRegistered(cleanUsername);

      if (!check.registered) {
        setError(
          `Username "@${cleanUsername}" is not registered. Please check the spelling or create a new account.`
        );
        setResetData(null);
        setLoading(false);
        return;
      }

      // If registered email exists, trigger Firebase reset email as backup
      if (check.email) {
        try {
          await resetPassword(check.email);
        } catch (fbErr) {
          console.warn("Background password reset notice:", fbErr.message);
        }
      }

      const baseUrl =
        typeof window !== "undefined"
          ? window.location.origin
          : "https://Rent.buildingindiadigital.com";

      const sessionToken = `rst_${Date.now().toString(36)}`;
      const resetUrl = `${baseUrl}/reset-password?username=${encodeURIComponent(
        cleanUsername
      )}&token=${sessionToken}`;

      // Save session for client verification
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          "pwd_reset_user",
          JSON.stringify({
            username: cleanUsername,
            token: sessionToken,
            createdAt: Date.now(),
          })
        );
      }

      setResetData({
        resetUrl,
        username: cleanUsername,
      });
    } catch (err) {
      console.error("Generate reset link error:", err);
      setError("Failed to verify username. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!resetData?.resetUrl) return;
    navigator.clipboard.writeText(resetData.resetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50/40 via-[#F8FAF9] to-slate-100 p-4 sm:p-6 antialiased">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xl">
        {/* Brand Header */}
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
            Reset Password
          </h2>
          <p className="mt-1 text-xs text-slate-500 max-w-xs">
            Enter your registered username to verify your account and generate your reset link
          </p>
        </div>

        {error && (
          <div className="mt-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 animate-in fade-in-50">
            <AlertCircle size={16} className="shrink-0 text-red-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {resetData ? (
          /* Reset Link Appears Directly on Screen */
          <div className="mt-6 space-y-4 animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle2 size={22} />
              </div>
              <h3 className="mt-2.5 text-sm font-bold text-emerald-950">
                Verified Account Found
              </h3>
              <p className="mt-1 text-xs text-emerald-800 leading-normal">
                Username verified: <strong className="font-mono text-emerald-950">@{resetData.username}</strong>
              </p>
            </div>

            {/* Link Preview Card */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Your Password Reset Link:
              </span>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 font-mono text-[11px] text-slate-800 break-all select-all shadow-2xs">
                {resetData.resetUrl}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3 py-2 text-xs font-semibold shadow-2xs transition-colors"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 size={13} className="text-emerald-600" />
                      <span className="text-emerald-700">Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>

                <Link
                  href={resetData.resetUrl}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-2 text-xs font-semibold shadow-xs transition-colors"
                >
                  <KeyRound size={13} />
                  <span>Reset Password Now</span>
                </Link>
              </div>
            </div>

            <div className="pt-2 text-center flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setResetData(null)}
                className="text-xs text-slate-500 hover:text-emerald-700 transition-colors"
              >
                Reset for a different username
              </button>

              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-slate-600 hover:text-emerald-700 transition-colors pt-1"
              >
                <ArrowLeft size={14} />
                <span>Return to Sign In</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Username Prompt Form */
          <form onSubmit={handleGenerateResetLink} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="username"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                Registered Username <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="username"
                  type="text"
                  required
                  placeholder="e.g. john_pg"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 pl-10 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all duration-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />
                <User
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Only registered usernames will be accepted to generate a password reset link
              </p>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                loading={loading}
                icon={KeyRound}
                className="w-full min-h-11 text-xs sm:text-sm font-semibold"
              >
                Verify Username & Generate Link
              </Button>
            </div>

            <div className="text-center pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-emerald-700 transition-colors"
              >
                <ArrowLeft size={14} />
                <span>Back to Sign In</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
