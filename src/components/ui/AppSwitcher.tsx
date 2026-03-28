"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutGrid, Plane, FileText, Home } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./Button";

export function AppSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const apps = [
    {
      name: "Home",
      description: "App launcher",
      icon: Home,
      href: "/",
      color: "indigo",
      isActive: pathname === "/",
    },
    {
      name: "Workspace",
      description: "Pages & Forms",
      icon: FileText,
      href: "/workspace",
      color: "blue",
      isActive: pathname?.startsWith("/workspace") || pathname?.startsWith("/pages") || pathname?.startsWith("/forms"),
    },
    {
      name: "Flightly",
      description: "Flight Tracker",
      icon: Plane,
      href: "/flights",
      color: "sky",
      isActive: pathname?.startsWith("/flights"),
    },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        className={`rounded-full transition-colors ${
          isOpen ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
        }`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Switch App"
      >
        <LayoutGrid className="w-5 h-5" />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Mobile backdrop */}
            <div
              className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40 sm:bg-transparent"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel: full-width bottom sheet on mobile, dropdown on desktop */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="
                fixed bottom-0 left-0 right-0 rounded-t-2xl
                sm:absolute sm:bottom-auto sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-72 sm:rounded-2xl
                bg-white dark:bg-slate-900 sm:bg-white/90 sm:dark:bg-slate-900/90
                backdrop-blur-xl border-t sm:border border-slate-200 dark:border-slate-800
                shadow-2xl z-50 origin-bottom sm:origin-top-right
              "
            >
              {/* Mobile drag handle */}
              <div className="flex justify-center pt-3 pb-1 sm:hidden">
                <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
              </div>

              <div className="p-3">
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-2">
                  Your Apps
                </h3>
                <div className="grid gap-1">
                  {apps.map((app) => (
                    <Link
                      key={app.name}
                      href={app.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 p-3 sm:p-3 rounded-xl transition-all ${
                        app.isActive
                          ? "bg-slate-50 dark:bg-slate-800/50"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      }`}
                    >
                      <div
                        className={`w-11 h-11 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0 ${
                          app.color === "blue"
                            ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
                            : app.color === "sky"
                            ? "bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400"
                            : "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400"
                        }`}
                      >
                        <app.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className={`font-semibold ${app.isActive ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-200"}`}>
                            {app.name}
                          </p>
                          {app.isActive && (
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{app.description}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Safe area padding for mobile devices with home indicator */}
              <div className="h-2 sm:h-0" />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
