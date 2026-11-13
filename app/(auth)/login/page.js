"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import PasswordInput from "@/components/ui/PasswordInput";
import Button from "@/components/ui/Button";
import { LogIn, AlertCircle, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("Please enter your username");
      return;
    }
    if (!password) {
      setError("Please enter your password");
      return;
    }

    try {
      setLoading(true);
      await login(username.trim(), password);
      router.replace("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      let msg = "Invalid username or password";
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        msg = "Invalid username or password. Please verify and try again.";
      } else if (err.code === "auth/operation-not-allowed") {
        msg = "Email/Password sign-in is not enabled in your Firebase project. Please enable Email/Password under Authentication > Sign-in method in the Firebase Console.";
      } else if (err.code === "auth/network-request-failed") {
        msg = "Network connection failed. If you have an ad blocker or Brave Shields enabled, please disable it for localhost and try again.";
      } else if (err.code === "auth/too-many-requests") {
        msg = "Access temporarily disabled due to multiple failed login attempts. Try again later or reset your password.";
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50/40 via-[#F8FAF9] to-slate-100 p-4 sm:p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xl">
        {/* Back to Home link */}
        <div className="mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Brand Logo & Name */}
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
            Welcome back
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Enter your credentials to access your properties & records
          </p>
        </div>

        {error && (
          <div className="mt-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50/90 p-3 text-xs text-red-700 animate-in fade-in-50">
            <AlertCircle size={16} className="shrink-0 text-red-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
              autoComplete="username"
              placeholder="e.g. john_pg"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all duration-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <PasswordInput
            id="password"
            label="Password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-xs text-slate-600">Remember me</span>
            </label>

            <Link
              href="/forgot-password"
              className="text-xs font-medium text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              loading={loading}
              icon={LogIn}
              className="w-full min-h-11 text-sm font-semibold"
            >
              Sign In to Dashboard
            </Button>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-slate-600 border-t border-slate-100 pt-4">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
          >
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}

