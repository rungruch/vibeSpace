"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LoginModal } from "@/components/LoginModal";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import {
  FileText, Plane, LogOut, LogIn, Sparkles, ArrowRight
} from "lucide-react";

const apps = [
  {
    name: "Workspace",
    description: "Create and manage pages & forms with a rich editor and form builder.",
    icon: FileText,
    href: "/workspace",
    gradient: "from-blue-600 to-indigo-600",
    hoverGradient: "group-hover:from-blue-500 group-hover:to-indigo-500",
    shadowColor: "shadow-blue-500/25",
    bgLight: "bg-blue-50",
    bgDark: "dark:bg-blue-950/30",
    borderHover: "hover:border-blue-500/40 dark:hover:border-blue-500/30",
    glowColor: "group-hover:shadow-blue-500/15",
    tag: "Pages & Forms",
  },
  {
    name: "Flightly",
    description: "Track flights in real-time with live status, gate changes, and delay alerts.",
    icon: Plane,
    href: "/flights",
    gradient: "from-sky-500 to-cyan-500",
    hoverGradient: "group-hover:from-sky-400 group-hover:to-cyan-400",
    shadowColor: "shadow-sky-500/25",
    bgLight: "bg-sky-50",
    bgDark: "dark:bg-sky-950/30",
    borderHover: "hover:border-sky-500/40 dark:hover:border-sky-500/30",
    glowColor: "group-hover:shadow-sky-500/15",
    tag: "Flight Tracker",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 250, damping: 22 },
  },
};

export default function Home() {
  const { user, logOut, loading, setShowLoginModal } = useAuth();
  const { resolvedTheme } = useTheme();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-8 h-8 border-2 border-slate-300 dark:border-slate-700 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen relative overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors flex flex-col">
      {/* Ambient Background */}
      <div className="fixed inset-0 overflow-clip pointer-events-none z-0">
        <AnimatePresence>
          <motion.div
            key="bg-blob-1"
            animate={{
              backgroundColor: resolvedTheme === "light" ? "rgba(219, 234, 254, 0.6)" : "rgba(30, 58, 138, 0.15)",
              scale: resolvedTheme === "light" ? 1 : 1.3,
            }}
            transition={{ duration: 0.8 }}
            className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full blur-3xl"
          />
          <motion.div
            key="bg-blob-2"
            animate={{
              backgroundColor: resolvedTheme === "light" ? "rgba(224, 231, 255, 0.5)" : "rgba(49, 46, 129, 0.15)",
              scale: resolvedTheme === "light" ? 1 : 1.3,
            }}
            transition={{ duration: 0.8 }}
            className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full blur-3xl"
          />
          <motion.div
            key="bg-blob-3"
            animate={{
              backgroundColor: resolvedTheme === "light" ? "rgba(186, 230, 253, 0.3)" : "rgba(12, 74, 110, 0.1)",
            }}
            transition={{ duration: 0.8 }}
            className="absolute top-[30%] right-[15%] w-[400px] h-[400px] rounded-full blur-3xl"
          />
        </AnimatePresence>
      </div>

      {/* Header */}
      <div className="relative z-50 w-full max-w-5xl mx-auto px-6 sm:px-12 pt-6 sm:pt-10 flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2.5"
        >
          <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 via-indigo-500 to-violet-500 rounded-xl shadow-md shadow-indigo-500/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">vibeSpace</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 sm:gap-3"
        >
          <ThemeToggle />

          {user ? (
            <div className="flex items-center gap-2 sm:gap-3 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-2">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-7 h-7 rounded-full shadow-sm" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xs">
                    {user.displayName?.charAt(0) || "U"}
                  </div>
                )}
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 hidden sm:block">
                  {user.displayName?.split(" ")[0]}
                </span>
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
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20 rounded-full px-5 h-9"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Sign In
            </Button>
          )}
        </motion.div>
      </div>

      {/* Center Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 sm:px-12 pb-12">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-10 sm:mb-14"
        >
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-br from-slate-900 via-slate-700 to-slate-500 dark:from-white dark:via-slate-200 dark:to-slate-400">
            {user ? `Hey, ${user.displayName?.split(" ")[0] || "there"}` : "Welcome"}
          </h1>
          <p className="text-lg sm:text-xl text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {user ? "What would you like to work on today?" : "Sign in to get started with your apps."}
          </p>
        </motion.div>

        {/* App Cards Grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-7 w-full max-w-3xl"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {apps.map((app) => (
            <motion.div key={app.name} variants={itemVariants}>
              <Link href={app.href} className="block outline-none group">
                <div
                  className={`relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800/80 ${app.borderHover} bg-white/70 dark:bg-slate-900/70 backdrop-blur-md transition-all duration-300 hover:shadow-2xl ${app.glowColor} p-6 sm:p-8`}
                >
                  {/* Gradient accent bar */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${app.gradient} opacity-60 group-hover:opacity-100 transition-opacity`} />

                  {/* Icon */}
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${app.gradient} ${app.hoverGradient} flex items-center justify-center shadow-lg ${app.shadowColor} mb-5 transition-all duration-300 group-hover:scale-105`}>
                    <app.icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                  </div>

                  {/* Tag */}
                  <span className={`inline-block text-xs font-semibold uppercase tracking-wider ${app.bgLight} ${app.bgDark} px-2.5 py-1 rounded-full mb-3 text-slate-600 dark:text-slate-300`}>
                    {app.tag}
                  </span>

                  {/* Title */}
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
                    {app.name}
                  </h2>

                  {/* Description */}
                  <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed mb-5">
                    {app.description}
                  </p>

                  {/* CTA */}
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
                    <span>Open</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <LoginModal />
    </main>
  );
}
