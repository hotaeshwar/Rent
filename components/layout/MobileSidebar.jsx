"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  BedDouble,
  Users,
  Receipt,
  Wallet,
  Wrench,
  UserCheck,
  FolderOpen,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  X,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/properties", label: "My Properties", icon: Building2 },
  { href: "/rooms", label: "Rooms & Beds", icon: BedDouble },
  { href: "/tenants", label: "Tenants", icon: Users },
  { href: "/rent", label: "Rent Collection", icon: Receipt },
  { href: "/expenses", label: "Expenses", icon: Wallet },
  { href: "/maintenance", label: "Maintenance", icon: Wrench },
  { href: "/staff", label: "Staff", icon: UserCheck },
  { href: "/documents", label: "Documents", icon: FolderOpen },
  { href: "/reports", label: "Reports & Analytics", icon: BarChart3 },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function MobileSidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const { user, userProfile, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  if (!isOpen) return null;

  const handleLogout = async () => {
    if (loggingOut) return;
    try {
      setLoggingOut(true);
      await logout();
      onClose();
    } catch (err) {
      console.error("Logout failed:", err);
      setLoggingOut(false);
    }
  };

  const displayName = userProfile?.fullName || user?.displayName || "Property Owner";
  const displayUsername = userProfile?.username ? `@${userProfile.username}` : user?.email || "";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out Panel */}
      <div className="fixed inset-y-0 left-0 flex w-72 flex-col bg-white shadow-2xl animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4">
          <Link href="/dashboard" onClick={onClose} className="flex items-center gap-3">
            <Image
              src="/images/bid-logo.png"
              alt="BiD Rent Manager"
              width={38}
              height={38}
              className="h-9 w-9 object-contain"
            />
            <span className="font-semibold tracking-tight text-base text-emerald-950">
              BiD Rent Manager
            </span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Links */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-emerald-50 text-emerald-800 font-semibold"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon
                  size={18}
                  className={isActive ? "text-emerald-700" : "text-slate-500"}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Mobile Profile & Logout */}
        <div className="border-t border-slate-100 p-4 bg-slate-50/60">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 text-xs font-semibold text-white shadow-xs">
              {initials || "BO"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-800">
                {displayName}
              </p>
              <p className="truncate text-[11px] text-slate-500">
                {displayUsername}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 shadow-2xs transition-colors hover:bg-red-50 disabled:opacity-50"
          >
            {loggingOut ? (
              <Loader2 size={17} className="animate-spin text-red-600" />
            ) : (
              <LogOut size={17} />
            )}
            <span>{loggingOut ? "Signing out..." : "Logout"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

