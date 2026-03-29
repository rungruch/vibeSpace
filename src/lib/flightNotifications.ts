"use client";

import { useEffect, useRef, useCallback } from "react";
import { differenceInMinutes, parseISO } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, updateDoc, addDoc, collection } from "firebase/firestore";
import { Flight, FlightNotification } from "@/types/flight";

// Request browser notification permission
export function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

// Send browser notification
function sendBrowserNotification(title: string, body: string) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, {
      body,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
    });
  }
}

// Create in-app notification in Firestore
async function createNotification(
  uid: string,
  notification: Omit<FlightNotification, "id" | "createdAt" | "read">
) {
  try {
    await addDoc(collection(db, "users", uid, "notifications"), {
      ...notification,
      read: false,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}

// Detect changes and generate notifications
function detectChanges(
  oldFlight: Flight,
  newChanges: Partial<Flight>
): Omit<FlightNotification, "id" | "createdAt" | "read">[] {
  const notifications: Omit<FlightNotification, "id" | "createdAt" | "read">[] = [];

  // Status change
  if (newChanges.status && newChanges.status !== oldFlight.status) {
    const statusLabels: Record<string, string> = {
      scheduled: "Scheduled",
      boarding: "Boarding",
      departed: "Departed",
      in_air: "In Air",
      landed: "Landed",
      arrived: "Arrived",
      cancelled: "Cancelled",
      delayed: "Delayed",
      diverted: "Diverted",
    };

    const oldLabel = statusLabels[oldFlight.status] || oldFlight.status;
    const newLabel = statusLabels[newChanges.status] || newChanges.status;

    let type: FlightNotification["type"] = "status_change";
    if (newChanges.status === "cancelled") type = "cancellation";
    else if (newChanges.status === "delayed") type = "delay";
    else if (newChanges.status === "departed") type = "departure";
    else if (newChanges.status === "landed" || newChanges.status === "arrived") type = "landing";

    notifications.push({
      flightId: oldFlight.id || "",
      flightNumber: oldFlight.flightNumber,
      type,
      title: `${oldFlight.flightNumber} — ${newLabel}`,
      message: `Flight status changed from ${oldLabel} to ${newLabel}. ${
        oldFlight.departure.iata} → ${oldFlight.arrival.iata}`,
      previousValue: oldLabel,
      newValue: newLabel,
    });
  }

  // Gate change
  if (newChanges.departure?.gate && newChanges.departure.gate !== oldFlight.departure.gate) {
    notifications.push({
      flightId: oldFlight.id || "",
      flightNumber: oldFlight.flightNumber,
      type: "gate_change",
      title: `${oldFlight.flightNumber} — Gate Changed`,
      message: `Departure gate changed from ${oldFlight.departure.gate || "—"} to ${newChanges.departure.gate}`,
      previousValue: oldFlight.departure.gate || "—",
      newValue: newChanges.departure.gate,
    });
  }

  return notifications;
}

interface UseFlightNotificationsProps {
  flights: (Flight & { id: string })[];
  enabled?: boolean;
}

// Returns the polling interval in ms for a given flight, or null to skip entirely.
function getFlightIntervalMs(flight: Flight): number | null {
  // Cancelled / diverted → never poll again
  if (["cancelled", "diverted"].includes(flight.status)) return null;

  // Arrived / landed → stop after 2 hours from arrival
  if (["arrived", "landed"].includes(flight.status)) {
    const arrivalTime =
      flight.arrival.times.actual ??
      flight.arrival.times.estimated ??
      flight.arrival.times.scheduled;
    if (arrivalTime) {
      const minsAgo = differenceInMinutes(new Date(), parseISO(arrivalTime));
      if (minsAgo >= 120) return null;
    }
    return 20 * 60_000; // recently arrived — one last check in 20 min
  }

  // In air or post-takeoff phases → 20 min (nobody watches mid-flight)
  if (["in_air", "departed", "boarding"].includes(flight.status)) {
    return 20 * 60_000;
  }

  // Scheduled / delayed → adaptive based on time until departure
  if (flight.departure.times.scheduled) {
    const minsUntil = differenceInMinutes(parseISO(flight.departure.times.scheduled), new Date());
    if (minsUntil > 1440) return 180 * 60_000; // > 24 hr → 3 hr
    if (minsUntil > 360) return 60 * 60_000;  // > 6 hr  → 60 min
    if (minsUntil > 180) return 10 * 60_000;  // > 3 hr  → 10 min
    if (minsUntil >  60) return  4 * 60_000;  // > 1 hr  →  4 min
    return 3 * 60_000;                             // ≤ 1 hr  →  3 min (imminent)
  }

  return 5 * 60_000; // fallback
}

export function useFlightNotifications({
  flights,
  enabled = true,
}: UseFlightNotificationsProps) {
  const { user } = useAuth();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flightsRef = useRef(flights);
  const lastCheckedRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    flightsRef.current = flights;
  }, [flights]);

  const checkForUpdates = useCallback(async () => {
    // Skip when tab is not visible — saves units on background tabs
    if (typeof document !== "undefined" && document.visibilityState === "hidden") return;

    const currentFlights = flightsRef.current;
    if (!user || !enabled || currentFlights.length === 0) return;

    const now = Date.now();
    const lastChecked = lastCheckedRef.current;

    for (const flight of currentFlights) {
      const intervalMs = getFlightIntervalMs(flight);
      if (intervalMs === null) continue; // this flight is done

      const lastCheck = lastChecked.get(flight.id) ?? 0;
      if (now - lastCheck < intervalMs) continue; // not time yet for this flight

      // Mark before fetch to prevent double-firing if checkForUpdates overlaps
      lastChecked.set(flight.id, now);
      try {
        const token = await user.getIdToken();
        const response = await fetch("/api/flights/status", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ flight }),
        });

        if (!response.ok) continue;
        const data = await response.json();

        if (data.updated && data.changes) {
          // Detect all changes (status, gate, etc.)
          const notifs = detectChanges(flight, data.changes);

          for (const notif of notifs) {
            // Save to Firestore
            await createNotification(user.uid, notif);

            // Browser notification
            sendBrowserNotification(notif.title, notif.message);
          }

          // Update flight in Firestore
          if (data.changes) {
            const flightRef = doc(db, "users", user.uid, "flights", flight.id);
            await updateDoc(flightRef, {
              ...data.changes,
              updatedAt: new Date().toISOString(),
            });
          }
        }
      } catch (error) {
        console.error(`Failed to check flight ${flight.flightNumber}:`, error);
      }
    }
  }, [user, enabled]);

  useEffect(() => {
    if (!enabled || !user) return;

    // Request notification permission on first mount
    requestNotificationPermission();

    // Initial check
    const timeout = setTimeout(checkForUpdates, 5000); // Delay initial check by 5s

    // Set up interval
    // Tick every 30 seconds; per-flight intervals are enforced inside checkForUpdates
    intervalRef.current = setInterval(checkForUpdates, 30_000);

    return () => {
      clearTimeout(timeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [checkForUpdates, enabled, user]);

  return { checkForUpdates };
}
