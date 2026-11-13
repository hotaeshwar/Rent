"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  Bell,
  LogOut,
  Settings,
  User,
  ChevronDown,
  Building,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { subscribeNotifications } from "@/lib/repositories/notificationRepo";

const ROUTE_TITLES = {
  "/dashboard": "Dashboard Overview",
  "/properties": "Property Management",
  "/rooms": "Rooms & Beds Management",
  "/tenants": "Tenants Management",
  "/rent": "Rent Collection & Invoices",
  "/expenses": "Expense Management",
  "/maintenance": "Maintenance Requests",
  "/staff": "Staff Management",
  "/documents": "Documents & Storage",
  "/reports": "Reports & Analytics",
  "/notifications": "Notifications Center",
  "/settings": "Account & System Settings",
};

export default function Navbar({ onOpenMobileMenu, collapsed }) {
  const pathname = usePathname();
  const { user, userProfile, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Listen for unread notifications count
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeNotifications(user.uid, (list) => {
      const unread = list.filter((n) => !n.read).length;
      setUnreadCount(unread);
    });
    return () => unsub();
  }, [user?.uid]);

  const handleLogout = async () => {
    if (loggingOut) return;
    try {
      setLoggingOut(true);
      await logout();
    } catch (err) {
      console.error("Logout failed:", err);
      setLoggingOut(false);
    }
  };

  const currentTitle = ROUTE_TITLES[pathname] || "Dashboard";
  const displayName = userProfile?.fullName || user?.displayName || "Property Owner";
  const displayUsername = userProfile?.username ? `@${userProfile.username}` : user?.email || "";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 md:hidden"
          aria-label="Open mobile navigation"
        >
          <Menu size={18} />
        </button>

        <div>
          <h1 className="text-base font-semibold text-slate-900 sm:text-lg">
            {currentTitle}
          </h1>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notifications Icon Button */}
        <Link
          href="/notifications"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
          aria-label="View notifications"
        >
          <Bell size={17} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-xs">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 p-1.5 transition-colors hover:bg-slate-50 focus:outline-none"
            aria-expanded={dropdownOpen}
            aria-label="User profile options"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 text-xs font-semibold text-white shadow-2xs">
              {initials || "BO"}
            </div>
            <span className="hidden text-xs font-medium text-slate-700 sm:inline truncate max-w-[120px]">
              {displayName}
            </span>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white py-1.5 shadow-lg animate-in fade-in-50 zoom-in-95 duration-150 z-50">
              <div className="border-b border-slate-100 px-3 py-2">
                <p className="text-xs font-semibold text-slate-800 truncate">
                  {displayName}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {displayUsername}
                </p>
              </div>

              <div className="py-1">
                <Link
                  href="/settings"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  <Settings size={15} className="text-slate-400" />
                  <span>Account Settings</span>
                </Link>
                <Link
                  href="/properties"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  <Building size={15} className="text-slate-400" />
                  <span>My Properties</span>
                </Link>
              </div>

              {/* Functional Logout button with exit door icon */}
              <div className="border-t border-slate-100 pt-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex min-h-9 w-full items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                >
                  {loggingOut ? (
                    <Loader2 size={16} className="animate-spin text-red-600" />
                  ) : (
                    <LogOut size={16} className="text-red-600" />
                  )}
                  <span>{loggingOut ? "Logging out..." : "Logout"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

