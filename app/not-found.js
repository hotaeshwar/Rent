"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { ALL_ROUTES } from "@/constants/routes";
import Button from "@/components/ui/Button";

export default function NotFound() {
  useEffect(() => {
    // GitHub Pages SPA route resolver: if visited with a trailing slash or alternate case,
    // resolve to the canonical clean route without trailing slash
    if (typeof window !== "undefined") {
      const currentPath = window.location.pathname.replace(/\/+$/, "");
      const cleanPath = currentPath || "/";

      const matched = ALL_ROUTES.find(
        (r) => r.toLowerCase() === cleanPath.toLowerCase()
      );

      if (matched && window.location.pathname !== matched) {
        window.location.replace(matched);
      }
    }
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8FAF9] p-4 text-center">
      <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-4xl font-extrabold text-emerald-950">404</h1>
        <h2 className="mt-2 text-lg font-bold text-slate-800">Page Not Found</h2>
        <p className="mt-2 text-xs text-slate-500">
          The requested page could not be found or has moved.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/">
            <Button className="text-xs font-semibold">Back to Home</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" className="text-xs font-semibold">
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

