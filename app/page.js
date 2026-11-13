"use client";

import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  BedDouble,
  Receipt,
  Wrench,
  BarChart3,
  Users,
} from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F0FDF4] via-[#F8FAF9] to-white flex flex-col antialiased">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 flex h-16 sm:h-20 items-center justify-between border-b border-emerald-100/60 bg-white/85 px-4 sm:px-6 md:px-8 lg:px-12 backdrop-blur-md">
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <Image
            src="/images/bid-logo.png"
            alt="BiD Rent Manager"
            width={48}
            height={48}
            className="h-9 w-9 sm:h-11 sm:w-11 md:h-12 md:w-12 object-contain shrink-0"
            priority
          />
          <span className="font-bold tracking-tight text-base sm:text-lg md:text-xl text-emerald-950 truncate">
            BiD Rent Manager
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={user ? "/properties" : "/register"}
            className="inline-flex h-8 sm:h-9 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 px-3.5 sm:px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition-all duration-200 hover:from-emerald-800 hover:to-teal-700 hover:shadow-sm active:scale-95 shrink-0"
          >
            <span>{user ? "My Properties" : "Get Started"}</span>
            <ArrowRight size={13} className="shrink-0" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-10 sm:py-16 md:py-20 lg:py-24 text-center max-w-5xl mx-auto w-full">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/90 px-3 sm:px-3.5 py-1 sm:py-1.5 text-[11px] sm:text-xs font-semibold text-emerald-800 shadow-2xs mb-5 sm:mb-6">
          <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
          <span>Next-Generation Firebase-Powered Rental Property SaaS</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.18] sm:leading-[1.15]">
          Effortless Management for <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">
            PGs, Hostels & Rental Estates
          </span>
        </h1>

        <p className="mt-4 sm:mt-5 max-w-2xl text-sm sm:text-base md:text-lg text-slate-600 leading-relaxed px-2">
          Streamline rooms, beds, tenants, monthly rent collections, digital payment receipts, maintenance requests, and real-time financial analytics in one unified dashboard.
        </p>

        {/* Feature Grid: 2 cols on mobile, 3 on tablet/iPad, 6 on desktop */}
        <div className="mt-10 sm:mt-14 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3.5 w-full">
          {[
            { label: "Rooms & Beds", icon: BedDouble },
            { label: "Tenant Check-in", icon: Users },
            { label: "Rent Invoicing", icon: Receipt },
            { label: "Maintenance", icon: Wrench },
            { label: "Financial Reports", icon: BarChart3 },
            { label: "Owner Security", icon: ShieldCheck },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex flex-col items-center justify-center rounded-xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-2xs transition-all duration-200 hover:border-emerald-300 hover:shadow-xs"
              >
                <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800 mb-2">
                  <Icon size={18} className="sm:w-5 sm:h-5" />
                </div>
                <span className="text-[11px] sm:text-xs font-semibold text-slate-800 text-center leading-tight">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-5 sm:py-6 text-center text-xs text-slate-400 border-t border-slate-100 px-4">
        &copy; {new Date().getFullYear()} BiD Rent Manager. All rights reserved.
      </footer>
    </div>
  );
}
