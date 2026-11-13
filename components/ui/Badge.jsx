"use client";

import React from "react";

export default function Badge({
  children,
  variant = "default", // success, warning, danger, info, neutral
  size = "md",
  className = "",
}) {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-0.5 text-xs",
    lg: "px-3 py-1 text-xs",
  };

  const variantClasses = {
    default: "bg-slate-100 text-slate-700 border-slate-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    warning: "bg-amber-50 text-amber-700 border-amber-200/80",
    danger: "bg-rose-50 text-rose-700 border-rose-200/80",
    info: "bg-sky-50 text-sky-700 border-sky-200/80",
    purple: "bg-purple-50 text-purple-700 border-purple-200/80",
  };

  return (
    <span
      className={`inline-flex items-center justify-center font-medium rounded-full border ${
        sizeClasses[size] || sizeClasses.md
      } ${variantClasses[variant] || variantClasses.default} ${className}`}
    >
      {children}
    </span>
  );
}

