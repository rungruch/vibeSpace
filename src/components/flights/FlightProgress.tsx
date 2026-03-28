"use client";

import { Flight } from "@/types/flight";
import { motion } from "framer-motion";
import { Plane } from "lucide-react";

interface FlightProgressProps {
  flight: Flight;
  compact?: boolean;
}

export function FlightProgress({ flight, compact = false }: FlightProgressProps) {
  const getProgress = (): number => {
    switch (flight.status) {
      case "scheduled": return 0;
      case "boarding": return 5;
      case "departed": return 10;
      case "in_air": {
        // Calculate based on time elapsed
        const depTime = new Date(flight.departure.times.actual || flight.departure.times.estimated || flight.departure.times.scheduled).getTime();
        const arrTime = new Date(flight.arrival.times.estimated || flight.arrival.times.scheduled).getTime();
        const now = Date.now();
        const elapsed = now - depTime;
        const total = arrTime - depTime;
        if (total <= 0) return 50;
        return Math.min(90, Math.max(15, (elapsed / total) * 100));
      }
      case "landed": return 95;
      case "arrived": return 100;
      case "cancelled": return 0;
      default: return 0;
    }
  };

  const progress = getProgress();
  const isActive = ["boarding", "departed", "in_air"].includes(flight.status);

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {flight.departure.iata}
        </span>
        <div className="flex-1 relative flex items-center">
          <div className="w-full h-[2px] bg-slate-200 dark:bg-slate-700 rounded-full">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-sky-400 to-cyan-400"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "easeInOut" }}
            />
          </div>
          {isActive && (
            <motion.div
              className="absolute"
              initial={{ left: "0%" }}
              animate={{ left: `${progress}%` }}
              transition={{ duration: 1, ease: "easeInOut" }}
              style={{ transform: "translate(-50%, 0)" }}
            >
              <Plane className="w-4 h-4 text-sky-500 -rotate-[0deg]" />
            </motion.div>
          )}
        </div>
        <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {flight.arrival.iata}
        </span>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Airport codes */}
      <div className="flex justify-between mb-2">
        <div className="text-left">
          <p className="text-3xl font-bold tracking-tighter text-slate-900 dark:text-white">
            {flight.departure.iata}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{flight.departure.city}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold tracking-tighter text-slate-900 dark:text-white">
            {flight.arrival.iata}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{flight.arrival.city}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative mt-4 mb-2">
        {/* Dots at endpoints */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600 z-10 border-2 border-white dark:border-slate-900" />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600 z-10 border-2 border-white dark:border-slate-900" />

        {/* Track */}
        <div className="mx-2 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-visible relative">
          {/* Filled progress */}
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          />

          {/* Plane icon */}
          {isActive && (
            <motion.div
              className="absolute top-1/2 z-20"
              initial={{ left: "0%" }}
              animate={{ left: `${progress}%` }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              style={{ transform: "translate(-50%, -50%)" }}
            >
              <div className="w-8 h-8 rounded-full bg-sky-500 shadow-lg shadow-sky-500/40 flex items-center justify-center">
                <Plane className="w-4 h-4 text-white" />
              </div>
            </motion.div>
          )}

          {/* Completed dot */}
          {progress === 100 && (
            <motion.div
              className="absolute right-0 top-1/2 z-20"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              style={{ transform: "translate(50%, -50%)" }}
            >
              <div className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
            </motion.div>
          )}
        </div>
      </div>

      {/* Duration */}
      {flight.duration && (
        <div className="text-center">
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {Math.floor(flight.duration / 60)}h {flight.duration % 60}m
          </span>
        </div>
      )}
    </div>
  );
}
