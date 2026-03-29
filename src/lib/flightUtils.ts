import { FlightStatus } from "@/types/flight";

export function mapAeroDataBoxStatus(status: string | undefined): FlightStatus {
  if (!status) return "unknown";
  const s = status.toLowerCase();
  if (s.includes("scheduled") || s.includes("expected")) return "scheduled";
  if (s.includes("boarding")) return "boarding";
  if (s.includes("departed") || s.includes("taxiing")) return "departed";
  if (s.includes("airborne") || s.includes("en route") || s.includes("cruise")) return "in_air";
  if (s.includes("landed") || s.includes("approaching")) return "landed";
  if (s.includes("arrived")) return "arrived";
  if (s.includes("cancel")) return "cancelled";
  if (s.includes("delay")) return "delayed";
  if (s.includes("divert")) return "diverted";
  return "unknown";
}

export function calculateFlightDuration(
  departureScheduledTime: string | undefined,
  arrivalScheduledTime: string | undefined,
  fallbackOriginDistanceTime: number | undefined
): number | undefined {
  if (departureScheduledTime && arrivalScheduledTime) {
    const dep = new Date(departureScheduledTime).getTime();
    const arr = new Date(arrivalScheduledTime).getTime();
    const diffMins = Math.round((arr - dep) / 60000);
    // Sanity check: if it's negative or impossibly long (>24h), fallback to distance time
    if (diffMins > 0 && diffMins < 1440) return diffMins;
  }
  return fallbackOriginDistanceTime;
}
