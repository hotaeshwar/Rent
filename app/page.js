"use client";

import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck, BedDouble, Receipt, Wrench, BarChart3, Users } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F0FDF4] via-[#F8FAF9] to-white flex flex-col">
      {/* Top Navbar with Existing Logo increased by 60% */}
      <header className="flex h-20 sm:h-24 items-center justify-between px-6 lg:px-12 border-b border-emerald-100/60 bg-white/70 backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <Image
            src="/images/bid-logo.png"
            alt="BiD Rent Manager"
            width={64}
            height={64}
            className="h-16 w-16 object-contain"
            priority
          />
          <span className="font-bold tracking-tight text-xl sm:text-2xl text-emerald-950">
            BiD Rent Manager
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={user ? "/properties" : "/register"}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-500 px-5 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:from-emerald-800 hover:to-teal-600 hover:shadow-md"
          >
            {user ? "My Properties" : "Get Started"}
            <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 sm:py-24 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/90 px-3.5 py-1.5 text-xs font-semibold text-emerald-800 shadow-2xs mb-6">
          <ShieldCheck size={15} className="text-emerald-600" />
          <span>Next-Generation Firebase-Powered Rental Property SaaS</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
          Effortless Management for <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">
            PGs, Hostels & Rental Estates
          </span>
        </h1>

        <p className="mt-5 max-w-2xl text-base sm:text-lg text-slate-600 leading-relaxed">
          Streamline rooms, beds, tenants, monthly rent collections, digital payment receipts, maintenance requests, and real-time financial analytics in one unified dashboard.
        </p>

        {/* Feature Grid */}
        <div className="mt-14 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 w-full">
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
                className="flex flex-col items-center justify-center rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs transition-all duration-200 hover:border-emerald-300 hover:shadow-xs"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800 mb-2">
                  <Icon size={20} />
                </div>
                <span className="text-xs font-semibold text-slate-800">{item.label}</span>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-slate-400 border-t border-slate-100">
        &copy; {new Date().getFullYear()} BiD Rent Manager. All rights reserved.
      </footer>
    </div>
  );
}
