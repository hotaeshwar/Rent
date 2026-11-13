"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
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
  Pin,
  PinOff,
} from "lucide-react";
import SidebarNavItem from "./SidebarNavItem";

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

export default function Sidebar({ collapsed, setCollapsed }) {
  const [isHovered, setIsHovered] = useState(false);

  // When unpinned (collapsed), hovering opens/expands the sidebar
  const isVisuallyExpanded = !collapsed || isHovered;

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`fixed left-0 top-0 hidden h-screen border-r border-slate-200/80 bg-white transition-all duration-300 ease-in-out lg:flex lg:flex-col ${
        isVisuallyExpanded
          ? "w-64 shadow-2xl z-40"
          : "w-20 shadow-xs z-30"
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4">
        <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
            <Image
              src="/images/bid-logo.png"
              alt="BiD Rent Manager"
              width={42}
              height={42}
              className="h-10 w-10 object-contain"
              priority
            />
          </div>
          {isVisuallyExpanded && (
            <div className="flex flex-col min-w-0">
              <span className="font-bold tracking-tight text-base text-emerald-950 truncate">
                BiD Rent Manager
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                Hostel & PG OS
              </span>
            </div>
          )}
        </Link>

        {/* Pin / Hover-mode toggle button */}
        {isVisuallyExpanded && (
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-emerald-700 transition-colors"
            title={collapsed ? "Pin sidebar open" : "Unpin (open & close on hover)"}
            aria-label={collapsed ? "Pin sidebar" : "Unpin sidebar"}
          >
            {collapsed ? <Pin size={13} /> : <PinOff size={13} className="text-emerald-600" />}
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 scrollbar-thin scrollbar-thumb-slate-200">
        {NAV_ITEMS.map((item) => (
          <SidebarNavItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            collapsed={!isVisuallyExpanded}
          />
        ))}
      </nav>
    </aside>
  );
}
