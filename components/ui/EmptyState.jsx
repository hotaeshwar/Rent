"use client";

import React from "react";
import Button from "./Button";
import { Plus } from "lucide-react";

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-2xs">
      {Icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          <Icon size={28} />
        </div>
      )}
      <h3 className="mt-4 text-base font-semibold text-slate-800">{title}</h3>
      <p className="mt-1.5 max-w-sm text-xs sm:text-sm text-slate-500">
        {description}
      </p>
      {actionLabel && onAction && (
        <div className="mt-5">
          <Button onClick={onAction} icon={Plus} size="md">
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

