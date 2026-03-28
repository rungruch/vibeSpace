"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { FlightSearchResult } from "@/types/flight";
import { FlightStatusBadge } from "@/components/flights/FlightStatusBadge";
import { FlightProgress } from "@/components/flights/FlightProgress";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plane, Search, Loader2, Info, Sparkles, X, Calendar, Clock, CheckCircle2
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { DEMO_FLIGHT_NUMBERS } from "@/lib/mockFlightData";

interface AddFlightModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddFlightModal({ isOpen, onClose }: AddFlightModalProps) {
  const { user, setShowLoginModal } = useAuth();
  const [flightNumber, setFlightNumber] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [result, setResult] = useState<FlightSearchResult | null>(null);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flightNumber.trim() || !date) return;

    setSearching(true);
    setResult(null);
    setError("");
    setSaved(false);

    try {
      const response = await fetch(
        `/api/flights/search?flightNumber=${encodeURIComponent(flightNumber.trim())}&date=${date}`
      );
      const data: FlightSearchResult = await response.json();

      if (data.found && data.flight) {
        setResult(data);
      } else {
        setError(data.error || "Flight not found. Please check the flight number and date.");
      }
    } catch (err) {
      setError("Failed to search for flight. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  const handleTrackFlight = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (!result?.flight) return;

    setSaving(true);
    try {
      const flightData = {
        ...result.flight,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await addDoc(collection(db, "users", user.uid, "flights"), flightData);
      setSaved(true);

      // Close modal after showing success state
      setTimeout(() => {
        onClose();
        // Reset state
        setFlightNumber("");
        setResult(null);
        setSaved(false);
      }, 1500);
    } catch (err) {
      console.error("Failed to save flight:", err);
      setError("Failed to save flight. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (iso: string | undefined) => {
    if (!iso) return "--:--";
    try {
      return format(parseISO(iso), "HH:mm");
    } catch {
      return "--:--";
    }
  };

  const flight = result?.flight;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed justify-center sm:items-center sm:flex inset-0 z-[100]">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />

          {/* Bottom Sheet / Modal Panel */}
          <motion.div
            initial={{ y: "100%", opacity: 0.5, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: "100%", opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="
              fixed bottom-0 left-0 right-0 sm:relative sm:bottom-auto sm:w-full sm:max-w-2xl
              flex flex-col bg-slate-50 dark:bg-slate-950 rounded-t-3xl sm:rounded-3xl
              shadow-2xl sm:shadow-[0_0_40px_-10px_rgba(0,0,0,0.3)] 
              max-h-[85vh] sm:max-h-[90vh] overflow-hidden
            "
          >
            {/* Header / Drag handle area */}
            <div className="flex-shrink-0 relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50">
              <div className="flex justify-center pt-3 pb-2 sm:hidden">
                <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
              </div>
              <div className="px-4 pb-4 sm:p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center shadow-sm shadow-sky-500/20">
                    <Plane className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Add Flight</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Search and track your journey</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full w-9 h-9 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0">
                  <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                </Button>
              </div>
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 custom-scrollbar pb-10">
              {/* Search form */}
              <Card className="bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="h-1.5 w-full bg-gradient-to-r from-sky-500 to-cyan-400" />
                <div className="p-5 sm:p-6">
                  <form onSubmit={handleSearch} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Flight Number
                        </label>
                        <Input
                          type="text"
                          value={flightNumber}
                          onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
                          placeholder="e.g. TG925"
                          className="h-12 text-lg font-mono tracking-wider bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Departure Date
                        </label>
                        <Input
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="h-12 text-base bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl"
                          required
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={searching || !flightNumber.trim()}
                      className="w-full h-12 mt-2 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white shadow-md shadow-sky-500/20 rounded-xl text-base font-medium disabled:opacity-50 transition-all"
                    >
                      {searching ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        <>
                          <Search className="w-5 h-5 mr-2" />
                          Search Flight
                        </>
                      )}
                    </Button>
                  </form>

                  {/* Demo hint */}
                  <div className="mt-5 flex items-start gap-2 p-3 rounded-xl bg-sky-50 dark:bg-sky-900/20 border border-sky-200/50 dark:border-sky-800/50">
                    <Sparkles className="w-4 h-4 text-sky-500 mt-0.5 shrink-0" />
                    <div className="text-xs text-sky-700 dark:text-sky-300">
                      <span className="font-semibold">Demo mode: </span>
                      Try these flights: <span className="font-mono bg-sky-100 dark:bg-sky-800 px-1 py-0.5 rounded">{DEMO_FLIGHT_NUMBERS.join(", ")}</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Error message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300 text-sm flex items-start gap-3 shadow-sm">
                      <Info className="w-5 h-5 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Flight Not Found</p>
                        <p className="mt-1 text-red-600 dark:text-red-400">{error}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Search result */}
              <AnimatePresence>
                {flight && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.98 }}
                    className="mt-6 drop-shadow-sm"
                  >
                    <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
                      <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 to-teal-400" />
                      <div className="p-5 sm:p-6">
                        {/* Flight header */}
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center shadow-sm text-white font-bold">
                              {flight.flightNumber.substring(0, 2)}
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                                {flight.flightNumber}
                              </h3>
                              <p className="text-sm text-slate-500 dark:text-slate-400">{flight.airline.name}</p>
                            </div>
                          </div>
                          <FlightStatusBadge status={flight.status} size="lg" />
                        </div>

                        {/* Route Map */}
                        <div className="mb-6">
                          <FlightProgress flight={flight} />
                        </div>

                        {/* Details grid */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80">
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> Date
                            </p>
                            <p className="font-semibold text-slate-900 dark:text-white text-sm">
                              {format(parseISO(`${flight.date}T00:00:00`), "EEE, MMM d, yy")}
                            </p>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80">
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Duration
                            </p>
                            <p className="font-semibold text-slate-900 dark:text-white text-sm">
                              {flight.duration ? `${Math.floor(flight.duration / 60)}h ${flight.duration % 60}m` : "--"}
                            </p>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80">
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Departure</p>
                            <p className="font-semibold text-slate-900 dark:text-white text-base">{formatTime(flight.departure.times.scheduled)}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                              {flight.departure.name}
                            </p>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80">
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Arrival</p>
                            <p className="font-semibold text-slate-900 dark:text-white text-base">{formatTime(flight.arrival.times.scheduled)}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                              {flight.arrival.name}
                            </p>
                          </div>
                        </div>

                        {/* Aircraft */}
                        {flight.aircraft?.model && (
                          <div className="flex items-center gap-2 mb-6 p-3 px-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80">
                            <Plane className="w-4 h-4 text-slate-400 shrink-0" />
                            <span className="text-sm text-slate-600 dark:text-slate-300 truncate">
                              {flight.aircraft.model}
                              {flight.aircraft.registration && ` · ${flight.aircraft.registration}`}
                            </span>
                          </div>
                        )}

                        <Button
                          onClick={handleTrackFlight}
                          disabled={saving || saved || !user}
                          className={`w-full h-12 text-base font-semibold shadow-md transition-all ${
                            saved
                              ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20 text-white"
                              : "bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white shadow-indigo-500/20"
                          }`}
                        >
                          {saving ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : saved ? (
                            <>
                              <CheckCircle2 className="w-5 h-5 mr-2" />
                              Flight Tracked!
                            </>
                          ) : (
                            <>
                              <Plane className="w-5 h-5 mr-2" />
                              Track This Flight
                            </>
                          )}
                        </Button>
                        {!user && (
                          <p className="text-xs text-center text-amber-500 dark:text-amber-400 mt-3 font-medium">
                            Please sign in to track flights.
                          </p>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
