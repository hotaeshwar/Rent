"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import Button from "@/components/ui/Button";
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const { resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      setLoading(true);
      await resetPassword(email);
      setSubmitted(true);
    } catch (err) {
      console.error("Password reset error:", err);
      // For security, still show success message or a clean message without exposing account presence
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50/40 via-[#F8FAF9] to-slate-100 p-4 sm:p-6">
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
            Reset your password
          </h2>
          <p className="mt-1 text-xs text-slate-500 max-w-xs">
            Enter your registered email address and we will send you a password recovery link
          </p>
        </div>

        {submitted ? (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50/80 p-5 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-emerald-900">
              Password Reset Link Sent
            </h3>
            <p className="mt-1.5 text-xs text-emerald-800 leading-relaxed">
              If an account is associated with <strong>{email}</strong>, you will receive an official recovery link shortly. Please check your spam folder as well.
            </p>

            <div className="mt-5">
              <Link
                href="/login"
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800 transition-colors w-full"
              >
                <ArrowLeft size={15} />
                Return to Login
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

            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                Registered Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="e.g. owner@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 pl-10 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all duration-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />
                <Mail
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                loading={loading}
                className="w-full min-h-11 text-sm font-semibold"
              >
                Send Recovery Email
              </Button>
            </div>

            <div className="text-center pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-emerald-700"
              >
                <ArrowLeft size={14} />
                Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

