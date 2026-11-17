"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import PasswordInput from "@/components/ui/PasswordInput";
import Button from "@/components/ui/Button";
import CloudflareTurnstile from "@/components/ui/CloudflareTurnstile";
import { UserPlus, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const turnstileRef = useRef(null);

  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) {
      setError("Please enter your full name");
      return;
    }

    const cleanUsername = username.trim().toLowerCase();
    const usernameRegex = /^[a-zA-Z0-9_]{4,20}$/;
    if (!usernameRegex.test(cleanUsername)) {
      setError("Username must be 4–20 characters and contain only letters, numbers, and underscores");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address for account recovery");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!acceptTerms) {
      setError("Please accept the terms and conditions to continue");
      return;
    }

    if (!turnstileToken) {
      setError("Please complete the Cloudflare security verification to continue");
      return;
    }

    try {
      setLoading(true);

      // Verify Cloudflare Turnstile token if server-side API is available
      try {
        const verifyRes = await fetch("/api/auth/verify-turnstile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: turnstileToken }),
        });
        const contentType = verifyRes.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const verifyData = await verifyRes.json();
          if (!verifyData.success) {
            setError(verifyData.error || "Security verification failed. Please try again.");
            setTurnstileToken("");
            turnstileRef.current?.reset();
            setLoading(false);
            return;
          }
        }
      } catch (verifyErr) {
        // Safe fallback on static hosting (GitHub Pages) where /api routes return 404 HTML
        console.warn("Turnstile API verification note:", verifyErr);
      }

      await register({
        fullName: fullName.trim(),
        username: cleanUsername,
        email: email.trim(),
        password,
      });
      router.replace("/dashboard");
    } catch (err) {
      console.error("Registration error:", err);
      turnstileRef.current?.reset();
      setTurnstileToken("");
      let msg = "Failed to create account. Please try again.";
      if (err.code === "auth/email-already-in-use") {
        msg = "An account with this email already exists. Please sign in.";
      } else if (err.code === "auth/weak-password") {
        msg = "Password is too weak. Please use letters and numbers.";
      } else if (err.code === "auth/operation-not-allowed") {
        msg = "Email/Password sign-in provider is not enabled in your Firebase Console. Please go to Firebase Console > Authentication > Sign-in method, click 'Email/Password', toggle Enable, and click Save.";
      } else if (err.code === "auth/network-request-failed") {
        msg = "Network request failed. Please check your internet connection and try again.";
      } else if (err.message && !err.message.includes("is not valid JSON") && !err.message.includes("Unexpected token")) {
        msg = err.message;
      }
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50/40 via-[#F8FAF9] to-slate-100 p-4 sm:p-6">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xl">
        {/* Back to Hero / Home link */}
        <div className="mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-3">
            <Image
              src="/images/bid-logo.png"
              alt="BiD Rent Manager"
              width={48}
              height={48}
              className="h-12 w-12 object-contain"
              priority
            />
            <span className="font-bold tracking-tight text-xl sm:text-2xl text-emerald-950">
              BiD Rent Manager
            </span>
          </div>
          <h2 className="mt-4 text-xl font-bold text-slate-800">
            Create Owner Account
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Start managing your PGs, rooms, tenants and rent in minutes
          </p>
        </div>

        {error && (
          <div className="mt-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50/90 p-3 text-xs text-red-700 animate-in fade-in-50">
            <AlertCircle size={16} className="shrink-0 text-red-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="fullName"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="fullName"
                type="text"
                required
                placeholder="e.g. John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all duration-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label
                htmlFor="username"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                Username <span className="text-red-500">*</span>
              </label>
              <input
                id="username"
                type="text"
                required
                placeholder="e.g. john_pg"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all duration-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700"
            >
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="e.g. owner@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all duration-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Required for password recovery and official notifications
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <PasswordInput
              id="password"
              label="Password"
              required
              placeholder="Min. 6 chars"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <PasswordInput
              id="confirmPassword"
              label="Confirm Password"
              required
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {/* Cloudflare Turnstile Verification */}
          <div className="pt-2">
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Human Verification <span className="text-red-500">*</span>
              </label>
              {turnstileToken && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                  <CheckCircle2 size={13} />
                  Verified
                </span>
              )}
            </div>
            <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col items-center sm:items-start">
              <CloudflareTurnstile
                ref={turnstileRef}
                onVerify={(token) => {
                  setTurnstileToken(token);
                  setError("");
                }}
                onError={(errCode) => {
                  setTurnstileToken("");
                  if (String(errCode).includes("110600")) {
                    setError(
                      "Cloudflare Domain Error: Please ensure 'localhost' is added to the Allowed Domains in your Cloudflare Turnstile widget settings at dash.cloudflare.com."
                    );
                  } else {
                    setError("Cloudflare verification could not be completed. Please refresh and try again.");
                  }
                }}
                onExpire={() => {
                  setTurnstileToken("");
                }}
              />
            </div>
          </div>

          <div className="pt-1">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                required
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-xs text-slate-600 leading-normal">
                I accept the{" "}
                <span className="text-emerald-700 font-medium">Terms of Service</span>{" "}
                and{" "}
                <span className="text-emerald-700 font-medium">Privacy Policy</span>.
              </span>
            </label>
          </div>

          <div className="pt-3">
            <Button
              type="submit"
              loading={loading}
              icon={UserPlus}
              className="w-full min-h-11 text-sm font-semibold"
            >
              Complete Registration
            </Button>
          </div>
        </form>

        <div className="mt-6 text-center text-xs text-slate-600 border-t border-slate-100 pt-4">
          Already registered?{" "}
          <Link
            href="/login"
            className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
          >
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
}

