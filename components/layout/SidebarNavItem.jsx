"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AnimatedLantern from "./AnimatedLantern";

export default function SidebarNavItem({
  href,
  icon: Icon,
  label,
  collapsed = false,
  badge = null,
  onClick,
}) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/dashboard" && pathname?.startsWith(href));
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link
        href={href}
        onClick={onClick}
        className={`group relative flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
          isActive
            ? "bg-emerald-50 text-emerald-800 font-semibold shadow-xs"
            : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
        } ${collapsed ? "justify-center px-2" : ""}`}
        title={collapsed ? label : undefined}
      >
        {/* Left active accent bar */}
        {isActive && (
          <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-emerald-600" />
        )}

        {/* Icon */}
        <Icon
          size={18}
          className={`shrink-0 transition-colors duration-150 ${
            isActive
              ? "text-emerald-700"
              : "text-slate-500 group-hover:text-emerald-700"
          }`}
        />

        {/* Label & Badge (hidden when collapsed) */}
        {!collapsed && (
          <span className="truncate pr-6 select-none">{label}</span>
        )}

        {!collapsed && badge != null && (
          <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
            {badge}
          </span>
        )}
      </Link>

      {/* Decorative Animated Lantern appearing ONLY on hover */}
      <AnimatedLantern isHovered={isHovered} />
    </div>
  );
}

