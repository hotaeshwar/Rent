"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import Button from "@/components/ui/Button";
import {
  Phone,
  Mail,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Copy,
  Send,
  ExternalLink,
  KeyRound,
  ShieldCheck,
} from "lucide-react";

export default function ForgotPasswordPage() {
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [resetData, setResetData] = useState(null); // { resetUrl, cleanPhone, formattedMessage }

  const { resetPassword } = useAuth();

  const handleGenerateResetLink = async (e) => {
    e.preventDefault();
    setError("");
    setCopied(false);

    // Validate phone number
    const digitsOnly = whatsappPhone.replace(/\D/g, "");
    if (!digitsOnly || digitsOnly.length < 10) {
      setError("Please enter a valid 10-digit WhatsApp mobile number");
      return;
    }

    if (!identifier.trim()) {
      setError("Please enter your registered email address or username");
      return;
    }

    try {
      setLoading(true);

      const phoneWithCountry = digitsOnly.length === 10 ? `91${digitsOnly}` : digitsOnly;
      const cleanIdent = identifier.trim().toLowerCase();

      // If identifier contains @, trigger Firebase background password reset as backup
      if (cleanIdent.includes("@")) {
        try {
          await resetPassword(cleanIdent);
        } catch (fbErr) {
          console.warn("Background email reset notice:", fbErr.message);
        }
      }

      // Generate unique secure reset session token
      const sessionToken = `rst_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

      // Construct live reset URL (using current host or Rent.buildingindiadigital.com)
      const baseUrl =
        typeof window !== "undefined"
          ? window.location.origin
          : "https://Rent.buildingindiadigital.com";

      const resetUrl = `${baseUrl}/reset-password?phone=${phoneWithCountry}&user=${encodeURIComponent(
        cleanIdent
      )}&token=${sessionToken}`;

      // Store temporary verification token in sessionStorage for reset page validation
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          "pwd_reset_session",
          JSON.stringify({
            phone: phoneWithCountry,
            user: cleanIdent,
            token: sessionToken,
            createdAt: Date.now(),
          })
        );
      }

      const waMessage = `*BiD Rent Manager - Password Reset*

Hello, here is your secure password reset recovery link:
${resetUrl}

Click the link above to securely set your new password.`;

      setResetData({
        resetUrl,
        cleanPhone: phoneWithCountry,
        displayPhone: digitsOnly.slice(-10),
        message: waMessage,
      });
    } catch (err) {
      console.error("Generate reset link error:", err);
      setError("Failed to generate password reset link. Please try again.");
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

  const handleOpenWhatsApp = () => {
    if (!resetData) return;
    const url = `https://wa.me/${resetData.cleanPhone}?text=${encodeURIComponent(
      resetData.message
    )}`;
    window.open(url, "_blank");
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
            Enter your WhatsApp mobile number to generate and receive your instant reset link
          </p>
        </div>

        {error && (
          <div className="mt-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 animate-in fade-in-50">
            <AlertCircle size={16} className="shrink-0 text-red-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {resetData ? (
          /* Reset Link Appears Here Instantly */
          <div className="mt-6 space-y-4 animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle2 size={22} />
              </div>
              <h3 className="mt-2.5 text-sm font-bold text-emerald-950">
                Reset Link Generated Successfully
              </h3>
              <p className="mt-1 text-xs text-emerald-800 leading-normal">
                Ready for WhatsApp Number: <strong className="font-mono text-emerald-950">+91 {resetData.displayPhone}</strong>
              </p>
            </div>

            {/* Link Preview Card */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Your Direct Password Reset Link:
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
                  <span>Reset Now</span>
                </Link>
              </div>
            </div>

            {/* Direct WhatsApp Share Action */}
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="w-full inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#20BD5A] text-white px-4 py-2.5 text-xs sm:text-sm font-semibold shadow-sm transition-all duration-150 active:scale-98"
            >
              <Send size={15} />
              <span>Send Link to WhatsApp (+91 {resetData.displayPhone})</span>
            </button>

            <div className="pt-2 text-center flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setResetData(null)}
                className="text-xs text-slate-500 hover:text-emerald-700 transition-colors"
              >
                Enter a different WhatsApp number
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
          /* Phone & User Prompt Form */
          <form onSubmit={handleGenerateResetLink} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="whatsappPhone"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                WhatsApp Mobile Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="whatsappPhone"
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 pl-10 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all duration-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />
                <Phone
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Your instant reset recovery link will be generated for this WhatsApp number
              </p>
            </div>

            <div>
              <label
                htmlFor="identifier"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                Registered Email or Username <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="identifier"
                  type="text"
                  required
                  placeholder="e.g. owner@example.com or username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 pl-10 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all duration-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                loading={loading}
                icon={KeyRound}
                className="w-full min-h-11 text-xs sm:text-sm font-semibold"
              >
                Generate WhatsApp Reset Link
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
