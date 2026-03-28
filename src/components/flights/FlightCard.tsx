"use client";

import { Flight } from "@/types/flight";
import { FlightStatusBadge } from "./FlightStatusBadge";
import { FlightProgress } from "./FlightProgress";
import { Card } from "@/components/ui/Card";
import { motion } from "framer-motion";
import { Plane, Clock, Calendar } from "lucide-react";
import Link from "next/link";
import { format, parseISO } from "date-fns";

interface FlightCardProps {
  flight: Flight & { id: string };
  variant?: "default" | "compact" | "upcoming";
}

function formatTime(isoString: string | undefined): string {
  if (!isoString) return "--:--";
  try {
    return format(parseISO(isoString), "HH:mm");
  } catch {
    return "--:--";
  }
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "";
  try {
    return format(parseISO(dateStr.length === 10 ? `${dateStr}T00:00:00` : dateStr), "MMM d, yyyy");
  } catch {
    return dateStr;
  }
}

// Airline accent colors
const AIRLINE_COLORS: Record<string, string> = {
  TG: "from-purple-600 to-purple-400",
  SQ: "from-amber-600 to-yellow-400",
  EK: "from-red-600 to-red-400",
  JL: "from-red-700 to-rose-500",
  CX: "from-emerald-700 to-emerald-400",
  AA: "from-blue-700 to-blue-500",
};

export function FlightCard({ flight, variant = "default" }: FlightCardProps) {
  const accentGradient = AIRLINE_COLORS[flight.airline.iata] || "from-sky-600 to-cyan-400";
  const depTime = flight.departure.times.actual || flight.departure.times.estimated || flight.departure.times.scheduled;
  const arrTime = flight.arrival.times.actual || flight.arrival.times.estimated || flight.arrival.times.scheduled;

  if (variant === "compact") {
    return (
      <Link href={`/flights/${flight.id}`} className="block">
        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 hover:border-sky-500/50 dark:hover:border-sky-500/50 hover:shadow-lg hover:shadow-sky-500/5 transition-all overflow-hidden">
            <div className={`h-1 w-full bg-gradient-to-r ${accentGradient}`} />
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${accentGradient} flex items-center justify-center`}>
                    <Plane className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-slate-900 dark:text-white">{flight.flightNumber}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">{flight.airline.name}</span>
                  </div>
                </div>
                <FlightStatusBadge status={flight.status} size="sm" />
              </div>
              <FlightProgress flight={flight} compact />
              <div className="flex items-center justify-between mt-2 text-xs text-slate-500 dark:text-slate-400">
                <span>{formatTime(depTime)}</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(flight.date)}
                </span>
                <span>{formatTime(arrTime)}</span>
              </div>
            </div>
          </Card>
        </motion.div>
      </Link>
    );
  }

  return (
    <Link href={`/flights/${flight.id}`} className="block">
      <motion.div whileHover={{ y: -2, scale: 1.005 }} whileTap={{ scale: 0.99 }} transition={{ duration: 0.2 }}>
        <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 hover:border-sky-500/40 dark:hover:border-sky-400/30 hover:shadow-xl hover:shadow-sky-500/10 transition-all overflow-hidden">
          {/* Accent bar */}
          <div className={`h-1.5 w-full bg-gradient-to-r ${accentGradient}`} />

          <div className="p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${accentGradient} flex items-center justify-center shadow-sm`}>
                  <Plane className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">
                    {flight.flightNumber}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {flight.airline.name}
                  </p>
                </div>
              </div>
              <FlightStatusBadge status={flight.status} />
            </div>

            {/* Route */}
            <FlightProgress flight={flight} compact />

            {/* Times */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="text-left">
                <p className="text-lg font-semibold text-slate-900 dark:text-white">{formatTime(depTime)}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {flight.departure.terminal ? `T${flight.departure.terminal}` : ""}
                  {flight.departure.gate ? ` · Gate ${flight.departure.gate}` : ""}
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-xs">
                    {flight.duration ? `${Math.floor(flight.duration / 60)}h ${flight.duration % 60}m` : "--"}
                  </span>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  {formatDate(flight.date)}
                </p>
              </div>

              <div className="text-right">
                <p className="text-lg font-semibold text-slate-900 dark:text-white">{formatTime(arrTime)}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {flight.arrival.terminal ? `T${flight.arrival.terminal}` : ""}
                  {flight.arrival.gate ? ` · Gate ${flight.arrival.gate}` : ""}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </Link>
  );
}
