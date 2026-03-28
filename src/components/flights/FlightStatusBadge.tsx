"use client";

import { FlightStatus } from "@/types/flight";
import { motion } from "framer-motion";

const STATUS_CONFIG: Record<FlightStatus, { label: string; color: string; bg: string; pulse?: boolean }> = {
  scheduled: { label: "Scheduled", color: "text-slate-600 dark:text-slate-300", bg: "bg-slate-100 dark:bg-slate-800" },
  boarding: { label: "Boarding", color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-50 dark:bg-amber-900/30", pulse: true },
  departed: { label: "Departed", color: "text-sky-700 dark:text-sky-300", bg: "bg-sky-50 dark:bg-sky-900/30" },
  in_air: { label: "In Air", color: "text-sky-700 dark:text-sky-200", bg: "bg-sky-100 dark:bg-sky-900/40", pulse: true },
  landed: { label: "Landed", color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-900/30" },
  arrived: { label: "Arrived", color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-900/30" },
  cancelled: { label: "Cancelled", color: "text-red-700 dark:text-red-300", bg: "bg-red-50 dark:bg-red-900/30" },
  delayed: { label: "Delayed", color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-50 dark:bg-amber-900/30", pulse: true },
  diverted: { label: "Diverted", color: "text-orange-700 dark:text-orange-300", bg: "bg-orange-50 dark:bg-orange-900/30" },
  unknown: { label: "Unknown", color: "text-slate-500 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-800" },
};

interface FlightStatusBadgeProps {
  status: FlightStatus;
  size?: "sm" | "md" | "lg";
}

export function FlightStatusBadge({ status, size = "md" }: FlightStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.unknown;

  const sizeClasses = {
    sm: "text-[10px] px-2 py-0.5",
    md: "text-xs px-2.5 py-1",
    lg: "text-sm px-3 py-1.5",
  };

  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`
        inline-flex items-center gap-1.5 rounded-full font-semibold tracking-wide uppercase
        ${config.bg} ${config.color} ${sizeClasses[size]}
      `}
    >
      {config.pulse && (
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
            status === "in_air" ? "bg-sky-400" :
            status === "boarding" ? "bg-amber-400" :
            status === "delayed" ? "bg-amber-400" : "bg-slate-400"
          }`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${
            status === "in_air" ? "bg-sky-500" :
            status === "boarding" ? "bg-amber-500" :
            status === "delayed" ? "bg-amber-500" : "bg-slate-500"
          }`} />
        </span>
      )}
      {config.label}
    </motion.span>
  );
}
