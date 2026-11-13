"use client";

import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import MobileSidebar from "./MobileSidebar";
import AuthGuard from "@/components/auth/AuthGuard";

export default function DashboardLayout({ children }) {
  // Collapsed by default enables open & close on hover; user can pin open anytime
  const [collapsed, setCollapsed] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#F8FAF9] text-[#172B25] antialiased">
        {/* Desktop / Tablet Sidebar */}
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

        {/* Mobile Slide-out Sidebar */}
        <MobileSidebar isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

        {/* Main Content Area */}
        <div
          className={`flex min-h-screen flex-col transition-all duration-300 ${
            collapsed ? "md:pl-20" : "md:pl-64"
          }`}
        >
          {/* Top Navbar */}
          <Navbar
            onOpenMobileMenu={() => setMobileOpen(true)}
            collapsed={collapsed}
          />

          {/* Page Body */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}

