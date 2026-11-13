"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function PasswordInput({
  label,
  id,
  value,
  onChange,
  error,
  placeholder = "••••••••",
  className = "",
  required = false,
  ...props
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          {...props}
          id={id}
          value={value}
          onChange={onChange}
          type={visible ? "text" : "password"}
          placeholder={placeholder}
          required={required}
          className={`w-full rounded-lg border bg-white px-3.5 py-2.5 pr-11 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all duration-200 focus:ring-2 ${
            error
              ? "border-red-400 focus:border-red-500 focus:ring-red-100"
              : "border-slate-200 focus:border-emerald-600 focus:ring-emerald-100"
          } ${className}`}
        />

        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((prev) => !prev)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute inset-y-0 right-1 inline-flex min-h-10 min-w-10 items-center justify-center text-slate-400 transition-colors hover:text-emerald-700 focus:outline-none"
        >
          {visible ? (
            <EyeOff size={18} className="transition-transform duration-150 active:scale-95" />
          ) : (
            <Eye size={18} className="transition-transform duration-150 active:scale-95" />
          )}
        </button>
      </div>

      {error && (
        <p className="mt-1 text-xs text-red-500 animate-in fade-in-50">{error}</p>
      )}
    </div>
  );
}

