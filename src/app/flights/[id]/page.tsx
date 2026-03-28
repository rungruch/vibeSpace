"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, deleteDoc, updateDoc } from "firebase/firestore";
import { Flight } from "@/types/flight";
import { FlightStatusBadge } from "@/components/flights/FlightStatusBadge";
import { FlightProgress } from "@/components/flights/FlightProgress";
import { NotificationBell } from "@/components/flights/NotificationBell";
import { AppSwitcher } from "@/components/ui/AppSwitcher";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LoginModal } from "@/components/LoginModal";
import { motion } from "framer-motion";
import {
  Plane, ArrowLeft, Loader2, Trash2, RefreshCw,
  Clock, Calendar, MapPin, Navigation, Info,
  Building2, DoorOpen, Luggage, StickyNote
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";

export default function FlightDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const [flight, setFlight] = useState<(Flight & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);

  // Real-time listener
  useEffect(() => {
    if (!user || !id) {
      setLoading(false);
      return;
    }

    const flightRef = doc(db, "users", user.uid, "flights", id);
    const unsubscribe = onSnapshot(flightRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = { id: snapshot.id, ...snapshot.data() } as Flight & { id: string };
        setFlight(data);
        setNotes(data.notes || "");
      } else {
        setFlight(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, id]);

  // Auto-refresh active flights
  useEffect(() => {
    if (!flight || !user) return;
    const isActive = ["scheduled", "boarding", "departed", "in_air", "delayed"].includes(flight.status);
    if (!isActive) return;

    const interval = setInterval(() => refreshStatus(), 60000);
    return () => clearInterval(interval);
  }, [flight, user]);

  const refreshStatus = async () => {
    if (!flight || !user) return;
    setRefreshing(true);

    try {
      const response = await fetch("/api/flights/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flight }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.updated && data.changes) {
          const flightRef = doc(db, "users", user.uid, "flights", flight.id);
          await updateDoc(flightRef, {
            ...data.changes,
            updatedAt: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      console.error("Failed to refresh status:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !flight) return;
    if (!confirm("Remove this flight from your tracked flights?")) return;

    try {
      await deleteDoc(doc(db, "users", user.uid, "flights", flight.id));
      router.push("/flights");
    } catch (error) {
      console.error("Failed to delete flight:", error);
    }
  };

  const handleSaveNotes = async () => {
    if (!user || !flight) return;
    try {
      await updateDoc(doc(db, "users", user.uid, "flights", flight.id), {
        notes,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to save notes:", error);
    }
  };

  const formatTime = (iso: string | undefined) => {
    if (!iso) return "--:--";
    try { return format(parseISO(iso), "HH:mm"); } catch { return "--:--"; }
  };

  const formatDateTime = (iso: string | undefined) => {
    if (!iso) return "--";
    try { return format(parseISO(iso), "MMM d, yyyy · HH:mm"); } catch { return "--"; }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="animate-spin text-sky-500 w-8 h-8" />
      </div>
    );
  }

  if (!flight) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-8">
        <Plane className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Flight not found</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">This flight may have been removed.</p>
        <Link href="/flights">
          <Button className="rounded-full">Back to Flights</Button>
        </Link>
      </div>
    );
  }

  const isActive = ["scheduled", "boarding", "departed", "in_air", "delayed"].includes(flight.status);
  const depScheduled = flight.departure.times.scheduled;
  const depActual = flight.departure.times.actual || flight.departure.times.estimated;
  const arrScheduled = flight.arrival.times.scheduled;
  const arrActual = flight.arrival.times.actual || flight.arrival.times.estimated;
  const isDelayed = depActual && new Date(depActual) > new Date(depScheduled);

  // Airline accent color
  const AIRLINE_COLORS: Record<string, string> = {
    TG: "from-purple-600 to-purple-400",
    SQ: "from-amber-600 to-yellow-400",
    EK: "from-red-600 to-red-400",
    JL: "from-red-700 to-rose-500",
    CX: "from-emerald-700 to-emerald-400",
    AA: "from-blue-700 to-blue-500",
  };
  const accentGradient = AIRLINE_COLORS[flight.airline.iata] || "from-sky-600 to-cyan-400";

  return (
    <main className="min-h-screen relative overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full bg-sky-200/30 dark:bg-sky-900/15 blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-cyan-200/20 dark:bg-cyan-900/10 blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative z-50 border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="absolute inset-0 bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl -z-10" />
        <div className="relative max-w-3xl mx-auto px-2 sm:px-8 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/flights">
              <Button variant="ghost" size="icon" className="rounded-full w-8 h-8 sm:w-9 sm:h-9 shrink-0">
                <ArrowLeft className="w-4 h-4 text-slate-500" />
              </Button>
            </Link>
            <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">{flight.flightNumber}</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <AppSwitcher />
            <NotificationBell />
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-8 py-6 space-y-5">
        {/* Hero card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className={`h-2 w-full bg-gradient-to-r ${accentGradient}`} />
            <div className="p-6">
              {/* Airline & status */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${accentGradient} flex items-center justify-center shadow-sm`}>
                    <Plane className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{flight.flightNumber}</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{flight.airline.name}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <FlightStatusBadge status={flight.status} size="lg" />
                  {isActive && (
                    <button
                      onClick={refreshStatus}
                      disabled={refreshing}
                      className="text-xs text-sky-500 hover:text-sky-600 flex items-center gap-1 transition-colors"
                    >
                      <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
                      {refreshing ? "Updating..." : "Refresh"}
                    </button>
                  )}
                </div>
              </div>

              {/* Route visualization */}
              <FlightProgress flight={flight} />

              {/* Date */}
              <div className="text-center mt-3">
                <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {format(parseISO(`${flight.date}T00:00:00`), "EEEE, MMMM d, yyyy")}
                </span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Times card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-5">
              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Schedule
              </h3>

              <div className="grid grid-cols-2 gap-6">
                {/* Departure */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-sky-500" />
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Departure</span>
                  </div>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                    {formatTime(depScheduled)}
                  </p>
                  {depActual && depActual !== depScheduled && (
                    <p className={`text-sm font-medium mt-1 ${isDelayed ? "text-amber-500" : "text-emerald-500"}`}>
                      {isDelayed ? "Delayed to " : "Actual: "}
                      {formatTime(depActual)}
                    </p>
                  )}
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{flight.departure.name}</p>
                </div>

                {/* Arrival */}
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end mb-3">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Arrival</span>
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                    {formatTime(arrScheduled)}
                  </p>
                  {arrActual && arrActual !== arrScheduled && (
                    <p className="text-sm font-medium mt-1 text-slate-500 dark:text-slate-400">
                      Actual: {formatTime(arrActual)}
                    </p>
                  )}
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{flight.arrival.name}</p>
                </div>
              </div>

              {/* Duration */}
              {flight.duration && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                  <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Flight duration: {Math.floor(flight.duration / 60)}h {flight.duration % 60}m
                  </span>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Airport details */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Departure airport */}
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800">
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                    <Navigation className="w-4 h-4 text-sky-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">From</p>
                    <p className="font-bold text-slate-900 dark:text-white">{flight.departure.iata}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">{flight.departure.city}, {flight.departure.country}</p>
                <div className="space-y-2">
                  {flight.departure.terminal && (
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-600 dark:text-slate-300">Terminal {flight.departure.terminal}</span>
                    </div>
                  )}
                  {flight.departure.gate && (
                    <div className="flex items-center gap-2 text-sm">
                      <DoorOpen className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-600 dark:text-slate-300">Gate {flight.departure.gate}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Arrival airport */}
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800">
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">To</p>
                    <p className="font-bold text-slate-900 dark:text-white">{flight.arrival.iata}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">{flight.arrival.city}, {flight.arrival.country}</p>
                <div className="space-y-2">
                  {flight.arrival.terminal && (
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-600 dark:text-slate-300">Terminal {flight.arrival.terminal}</span>
                    </div>
                  )}
                  {flight.arrival.gate && (
                    <div className="flex items-center gap-2 text-sm">
                      <DoorOpen className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-600 dark:text-slate-300">Gate {flight.arrival.gate}</span>
                    </div>
                  )}
                  {flight.arrival.baggageClaim && (
                    <div className="flex items-center gap-2 text-sm">
                      <Luggage className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-600 dark:text-slate-300">{flight.arrival.baggageClaim}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </motion.div>

        {/* Aircraft info */}
        {flight.aircraft?.model && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800">
              <div className="p-5">
                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Plane className="w-4 h-4" /> Aircraft
                </h3>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
                    <Plane className="w-7 h-7 text-slate-400 dark:text-slate-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{flight.aircraft.model}</p>
                    {flight.aircraft.registration && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-mono mt-0.5">{flight.aircraft.registration}</p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Notes */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800">
            <div className="p-5">
              <button
                onClick={() => setShowNotes(!showNotes)}
                className="w-full flex items-center justify-between text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
              >
                <span className="flex items-center gap-2">
                  <StickyNote className="w-4 h-4" /> Notes
                </span>
                <span className="text-xs normal-case font-normal">{showNotes ? "Hide" : "Show"}</span>
              </button>

              {showNotes && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    onBlur={handleSaveNotes}
                    placeholder="Add notes about this flight..."
                    className="w-full h-24 p-3 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500/50"
                  />
                </motion.div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Last update & actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="flex items-center justify-between">
            {flight.lastApiUpdate && (
              <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                <Info className="w-3 h-3" />
                Last updated: {formatDateTime(flight.lastApiUpdate)}
              </p>
            )}
            <Button
              variant="ghost"
              onClick={handleDelete}
              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full px-4 h-9 text-sm"
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              Remove Flight
            </Button>
          </div>
        </motion.div>
      </div>

      <LoginModal />
    </main>
  );
}
