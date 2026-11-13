"use client";

import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend, // { value: "+12%", positive: true }
  variant = "default", // default, emerald, blue, amber, purple
}) {
  const iconVariants = {
    default: "bg-slate-100 text-slate-700",
    emerald: "bg-emerald-50 text-emerald-700",
    blue: "bg-sky-50 text-sky-700",
    amber: "bg-amber-50 text-amber-700",
    purple: "bg-purple-50 text-purple-700",
    red: "bg-rose-50 text-rose-700",
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-5 shadow-2xs transition-all duration-200 hover:shadow-xs hover:border-slate-300">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
          {title}
        </span>
        {Icon && (
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-lg ${
              iconVariants[variant] || iconVariants.default
            }`}
          >
            <Icon size={18} />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {value}
        </span>
      </div>

      {(subtitle || trend) && (
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
          {trend && (
            <span
              className={`inline-flex items-center gap-0.5 font-semibold ${
                trend.positive ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {trend.positive ? (
                <TrendingUp size={13} />
              ) : (
                <TrendingDown size={13} />
              )}
              {trend.value}
            </span>
          )}
          {subtitle && <span className="truncate">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}

