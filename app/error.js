"use client";

import React, { useEffect } from "react";
import Button from "@/components/ui/Button";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAF9] p-4">
      <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-lg">
        <h2 className="text-xl font-bold text-slate-800">Something went wrong</h2>
        <p className="mt-2 text-xs text-slate-500">
          An unexpected error occurred. Please try again or return home.
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <Button onClick={() => reset()} className="text-xs">
            Try again
          </Button>
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/")}
            className="text-xs"
          >
            Go to Home
          </Button>
        </div>
      </div>
    </div>
  );
}

