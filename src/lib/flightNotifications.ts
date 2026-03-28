"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, addDoc, query, where, serverTimestamp } from "firebase/firestore";
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
  refreshIntervalMs?: number;
}

export function useFlightNotifications({
  flights,
  enabled = true,
  refreshIntervalMs = 60000, // 1 minute
}: UseFlightNotificationsProps) {
  const { user } = useAuth();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkForUpdates = useCallback(async () => {
    if (!user || !enabled || flights.length === 0) return;

    // Only check upcoming/active flights
    const activeFlights = flights.filter((f) =>
      ["scheduled", "boarding", "departed", "in_air", "delayed"].includes(f.status)
    );

    for (const flight of activeFlights) {
      try {
        const response = await fetch("/api/flights/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ flight }),
        });

        if (!response.ok) continue;
        const data = await response.json();

        if (data.updated && data.previousStatus !== data.newStatus) {
          // Detect all changes
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
  }, [user, flights, enabled]);

  useEffect(() => {
    if (!enabled || !user) return;

    // Request notification permission on first mount
    requestNotificationPermission();

    // Initial check
    const timeout = setTimeout(checkForUpdates, 5000); // Delay initial check by 5s

    // Set up interval
    intervalRef.current = setInterval(checkForUpdates, refreshIntervalMs);

    return () => {
      clearTimeout(timeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [checkForUpdates, enabled, refreshIntervalMs, user]);

  return { checkForUpdates };
}
