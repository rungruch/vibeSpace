"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Plane, AlertTriangle, CheckCircle2, XCircle, ArrowRightLeft, Clock } from "lucide-react";
import { FlightNotification } from "@/types/flight";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, writeBatch, limit } from "firebase/firestore";

const NOTIFICATION_ICONS: Record<string, React.ReactNode> = {
  status_change: <ArrowRightLeft className="w-4 h-4" />,
  delay: <Clock className="w-4 h-4" />,
  gate_change: <Plane className="w-4 h-4" />,
  cancellation: <XCircle className="w-4 h-4" />,
  departure: <Plane className="w-4 h-4" />,
  landing: <CheckCircle2 className="w-4 h-4" />,
};

const NOTIFICATION_COLORS: Record<string, string> = {
  status_change: "text-sky-500 bg-sky-50 dark:bg-sky-900/30",
  delay: "text-amber-500 bg-amber-50 dark:bg-amber-900/30",
  gate_change: "text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30",
  cancellation: "text-red-500 bg-red-50 dark:bg-red-900/30",
  departure: "text-sky-500 bg-sky-50 dark:bg-sky-900/30",
  landing: "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30",
};

export function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<(FlightNotification & { id: string })[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hasNew, setHasNew] = useState(false);

  // Listen to notifications in real-time
  useEffect(() => {
    if (!user) return;

    const notifQuery = query(
      collection(db, "users", user.uid, "notifications"),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(notifQuery, (snapshot) => {
      const notifs = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as (FlightNotification & { id: string })[];

      setNotifications(notifs);

      const unreadCount = notifs.filter((n) => !n.read).length;
      setHasNew(unreadCount > 0);
    });

    return () => unsubscribe();
  }, [user]);

  const markAllRead = useCallback(async () => {
    if (!user) return;
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;

    const batch = writeBatch(db);
    unread.forEach((n) => {
      batch.update(doc(db, "users", user.uid, "notifications", n.id), { read: true });
    });
    await batch.commit();
    setHasNew(false);
  }, [user, notifications]);

  const markOneRead = async (notifId: string) => {
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid, "notifications", notifId), { read: true });
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const formatTimeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  if (!user) return null;

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && hasNew) markAllRead();
        }}
        className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        {hasNew && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-0.5 right-0.5 flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-500 rounded-full shadow-sm"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop — visible tint on mobile, transparent on desktop */}
            <div
              className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40 sm:bg-transparent"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel: full-width bottom sheet on mobile, dropdown on desktop */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="
                fixed bottom-0 left-0 right-0 rounded-t-2xl max-h-[75vh]
                sm:absolute sm:bottom-auto sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 sm:rounded-2xl sm:max-h-[70vh]
                overflow-hidden flex flex-col
                bg-white dark:bg-slate-900
                border-t sm:border border-slate-200 dark:border-slate-800
                shadow-2xl shadow-slate-900/20 dark:shadow-black/40
                z-50
              "
            >
              {/* Mobile drag handle */}
              <div className="flex justify-center pt-3 pb-1 sm:hidden">
                <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Flight Notifications</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      No notifications yet
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      You&apos;ll see flight updates here
                    </p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`px-4 py-3 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${
                        !notif.read ? "bg-sky-50/50 dark:bg-sky-900/10" : ""
                      }`}
                      onClick={() => markOneRead(notif.id)}
                    >
                      <div className="flex gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          NOTIFICATION_COLORS[notif.type] || "text-slate-500 bg-slate-100 dark:bg-slate-800"
                        }`}>
                          {NOTIFICATION_ICONS[notif.type] || <Bell className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                              {notif.title}
                            </p>
                            {!notif.read && (
                              <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                            {notif.message}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                            {formatTimeAgo(notif.createdAt)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
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
