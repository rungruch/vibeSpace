"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { Flight } from "@/types/flight";
import { FlightCard } from "@/components/flights/FlightCard";
import { NotificationBell } from "@/components/flights/NotificationBell";
import { AppSwitcher } from "@/components/ui/AppSwitcher";
import { AddFlightModal } from "@/components/flights/AddFlightModal";
import { useFlightNotifications } from "@/lib/flightNotifications";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LoginModal } from "@/components/LoginModal";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  Plane, PlusCircle, ArrowLeft, Loader2, LogIn, LogOut,
  MapPin, Clock, CalendarDays, Wifi, WifiOff, Search
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { parseISO } from "date-fns";

export default function FlightsPage() {
  const { user, loading, setShowLoginModal, logOut } = useAuth();
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);
  const [flights, setFlights] = useState<(Flight & { id: string })[]>([]);
  const [fetchingData, setFetchingData] = useState(true);

  // Real-time listener for flights
  useEffect(() => {
    if (!user) {
      setFetchingData(false);
      return;
    }

    setFetchingData(true);
    const flightsQuery = query(
      collection(db, "users", user.uid, "flights"),
      orderBy("date", "desc")
    );

    const unsubscribe = onSnapshot(flightsQuery, (snapshot) => {
      const flightsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as (Flight & { id: string })[];
      setFlights(flightsList);
      setFetchingData(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Set up notifications for active flights
  useFlightNotifications({
    flights,
    enabled: !!user,
    refreshIntervalMs: 60000,
  });

  // Split flights into upcoming and past
  const now = new Date();
  const upcomingFlights = flights
    .filter((f) => {
      const depDate = new Date(f.departure.times.scheduled);
      return depDate >= now || ["scheduled", "boarding", "departed", "in_air", "delayed"].includes(f.status);
    })
    .sort((a, b) => new Date(a.departure.times.scheduled).getTime() - new Date(b.departure.times.scheduled).getTime());

  const pastFlights = flights
    .filter((f) => {
      const depDate = new Date(f.departure.times.scheduled);
      return depDate < now && ["landed", "arrived", "cancelled"].includes(f.status);
    })
    .sort((a, b) => new Date(b.departure.times.scheduled).getTime() - new Date(a.departure.times.scheduled).getTime());

  // Stats
  const totalFlights = pastFlights.length;
  const uniqueAirports = new Set([
    ...flights.map((f) => f.departure.iata),
    ...flights.map((f) => f.arrival.iata),
  ]).size;
  const totalHours = Math.round(
    flights.reduce((sum, f) => sum + (f.duration || 0), 0) / 60
  );

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="animate-spin text-sky-500 w-8 h-8" />
      </div>
    );
  }

  return (
    <main className="min-h-screen p-6 sm:p-12 relative overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full bg-sky-200/30 dark:bg-sky-900/15 blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-cyan-200/20 dark:bg-cyan-900/10 blur-3xl" />
        <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full bg-indigo-200/10 dark:bg-indigo-900/5 blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative z-50 w-full mb-8 sm:mb-16 max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-2.5 ml-1 sm:ml-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center shadow-sm shadow-sky-500/20 shrink-0">
                <Plane className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Flightly</span>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-3">
            <AppSwitcher />
            {user && <NotificationBell />}
            <ThemeToggle />
            


            {user ? (
              <div className="flex items-center gap-2 sm:gap-3 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm ml-1 sm:ml-0">
                <div className="flex items-center gap-2">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="w-7 h-7 rounded-full shadow-sm" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-sky-500 flex items-center justify-center text-white font-bold text-xs">
                      {user.displayName?.charAt(0) || "U"}
                    </div>
                  )}
                </div>
                <div className="hidden sm:block w-px h-5 bg-slate-300 dark:bg-slate-700" />
                <Button variant="ghost" size="icon" onClick={logOut} className="text-slate-500 hover:text-red-500 rounded-full w-7 h-7 sm:w-auto sm:px-2">
                  <LogOut className="w-4 h-4 sm:mr-1.5 shrink-0" />
                  <span className="hidden sm:inline text-xs">Logout</span>
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setShowLoginModal(true)}
                className="bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white shadow-md shadow-sky-500/20 rounded-full px-5 h-9 ml-1 sm:ml-0"
              >
                <LogIn className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Sign In</span>
              </Button>
            )}
          </div>
        </div>
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Not signed in */}
        {!user && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center p-16 text-center mt-8"
          >
            <div className="w-20 h-20 bg-sky-100 dark:bg-sky-900/30 rounded-full flex items-center justify-center mb-6">
              <Plane className="text-sky-400 w-10 h-10" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Sign in to track flights</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm text-base mb-6">
              Add your flights and get real-time updates on status, gate changes, and delays.
            </p>
            <Button
              onClick={() => setShowLoginModal(true)}
              className="bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white shadow-md shadow-sky-500/20 rounded-full px-6 h-10"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Sign In with Google
            </Button>
          </motion.div>
        )}

        {/* Stats banner */}
        {user && flights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-3 gap-3 mb-8"
          >
            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 p-4 text-center">
              <CalendarDays className="w-5 h-5 text-sky-500 mx-auto mb-1.5" />
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalFlights}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Flights Taken</p>
            </div>
            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 p-4 text-center">
              <MapPin className="w-5 h-5 text-cyan-500 mx-auto mb-1.5" />
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{uniqueAirports}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Airports</p>
            </div>
            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 p-4 text-center">
              <Clock className="w-5 h-5 text-indigo-500 mx-auto mb-1.5" />
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalHours}h</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">In the Air</p>
            </div>
          </motion.div>
        )}

        {/* Loading state */}
        {user && fetchingData && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-sky-500 w-6 h-6" />
          </div>
        )}

        {/* Empty state */}
        {user && !fetchingData && flights.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center p-16 text-center"
          >
            <div className="w-20 h-20 bg-sky-100 dark:bg-sky-900/30 rounded-full flex items-center justify-center mb-6">
              <Plane className="text-sky-400 w-10 h-10" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">No flights tracked yet</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm text-base mb-6">
              Add your first flight to start tracking real-time status updates.
            </p>
            <Button 
                onClick={() => setShowAddModal(true)}
                className="bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white shadow-md shadow-sky-500/20 rounded-full px-6 h-10"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Your First Flight
            </Button>
          </motion.div>
        )}

        {/* Quick Add Search Bar */}
        {user && !fetchingData && flights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div 
              onClick={() => setShowAddModal(true)}
              className="group relative flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 sm:p-3 shadow-sm hover:shadow-md hover:border-sky-500/50 transition-all cursor-pointer"
            >
              <div className="flex-1 flex items-center gap-3 px-3">
                <Search className="w-5 h-5 text-slate-400 group-hover:text-sky-500 transition-colors" />
                <div className="flex flex-col">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Search to track a flight...</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:block">e.g. TG925 or AA100</span>
                </div>
              </div>
              <Button className="bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white shadow-md shadow-sky-500/20 rounded-xl px-5 h-10 sm:h-12 shrink-0">
                Search
              </Button>
            </div>
          </motion.div>
        )}

        {/* Upcoming flights */}
        {user && upcomingFlights.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1.5 text-sky-500">
                <Wifi className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Upcoming</h2>
              <span className="text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                {upcomingFlights.length}
              </span>
            </div>
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              {upcomingFlights.map((flight) => (
                <motion.div key={flight.id} variants={itemVariants}>
                  <FlightCard flight={flight} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        )}

        {/* Past flights */}
        {user && pastFlights.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1.5 text-slate-400">
                <WifiOff className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Past Flights</h2>
              <span className="text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                {pastFlights.length}
              </span>
            </div>
            <motion.div
              className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-6"
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              {pastFlights.map((flight) => (
                <motion.div key={flight.id} variants={itemVariants} className="h-full">
                  <FlightCard flight={flight} variant="compact" />
                </motion.div>
              ))}
            </motion.div>
          </div>
        )}


      </div>

      <LoginModal />

      <AddFlightModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
      />
    </main>
  );
}
