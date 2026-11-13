"use client";

import React from "react";
import { Loader2 } from "lucide-react";

export default function Button({
  children,
  type = "button",
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon: Icon,
  className = "",
  onClick,
  ...props
}) {
  const baseClasses =
    "inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 select-none active:scale-[0.98]";

  const sizeClasses = {
    sm: "min-h-8 px-2.5 py-1.5 text-xs rounded-md gap-1.5",
    md: "min-h-10 px-3 py-2 text-xs sm:text-sm rounded-lg gap-2",
    lg: "min-h-11 px-4 py-2.5 text-sm sm:text-base rounded-lg gap-2.5",
  };

  const variantClasses = {
    primary:
      "bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-500 text-white shadow-sm hover:from-emerald-800 hover:to-teal-600 hover:shadow-md",
    secondary:
      "bg-slate-100 text-slate-800 hover:bg-slate-200/90 shadow-sm border border-slate-200/60",
    outline:
      "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-sm",
    danger:
      "bg-red-600 text-white hover:bg-red-700 shadow-sm hover:shadow-md focus-visible:ring-red-400",
    dangerOutline:
      "bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300",
    ghost:
      "bg-transparent text-slate-700 hover:bg-slate-100/80 hover:text-slate-900",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${sizeClasses[size] || sizeClasses.md} ${
        variantClasses[variant] || variantClasses.primary
      } ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-current" />
      ) : Icon ? (
        <Icon className="h-4 w-4 shrink-0" />
      ) : null}
      <span>{children}</span>
    </button>
  );
}

