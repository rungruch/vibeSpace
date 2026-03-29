import { NextRequest, NextResponse } from "next/server";
import { FlightStatus } from "@/types/flight";
import { mapAeroDataBoxStatus, calculateFlightDuration } from "@/lib/flightUtils";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const flightNumber = searchParams.get("flightNumber");
  const date = searchParams.get("date");

  if (!flightNumber || !date) {
    return NextResponse.json(
      { found: false, error: "Missing flightNumber or date parameter" },
      { status: 400 }
    );
  }

  // 1. Simple Frontend Token Check (Deter casual bot abuse)
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ found: false, error: "Unauthorized" }, { status: 401 });
  }

  // 2. Input sanitization for `date`
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ found: false, error: "Invalid date format. Expected YYYY-MM-DD" }, { status: 400 });
  }
  const safeDate = encodeURIComponent(date);

  const apiKey = process.env.AERODATABOX_API_KEY;

  // Use real API if key is configured
  if (apiKey) {
    try {
      const response = await fetch(
        `https://aerodatabox.p.rapidapi.com/flights/number/${encodeURIComponent(flightNumber)}/${safeDate}`,
        {
          headers: {
            "x-rapidapi-key": apiKey,
            "x-rapidapi-host": "aerodatabox.p.rapidapi.com",
          },
        }
      );

      if (!response.ok) {
        return NextResponse.json(
          { found: false, error: "Flight not found or API error" },
          { status: response.status }
        );
      }

      const data = await response.json();

      if (!data || (Array.isArray(data) && data.length === 0)) {
        return NextResponse.json({ found: false, error: "Flight not found" });
      }

      // Normalize AeroDataBox response to our Flight type
      const apiData = Array.isArray(data) ? data[0] : data;
      const iata = apiData.airline?.iata || "";
      const rawNumber = apiData.number || flightNumber;
      
      // Prevent double IATA string (e.g., 'TGTG925')
      const cleanNumber = rawNumber.startsWith(iata) && iata !== "" 
        ? rawNumber.substring(iata.length) 
        : rawNumber;

      const flight = {
        flightNumber: `${iata}${cleanNumber}`,
        date,
        airline: {
          name: apiData.airline?.name || "Unknown",
          iata: apiData.airline?.iata || "",
        },
        departure: {
          name: apiData.departure?.airport?.name || "Unknown",
          iata: apiData.departure?.airport?.iata || "",
          city: apiData.departure?.airport?.municipalityName || "",
          country: apiData.departure?.airport?.countryCode || "",
          terminal: apiData.departure?.terminal || undefined,
          gate: apiData.departure?.gate || undefined,
          location: apiData.departure?.airport?.location?.lat ? {
            lat: apiData.departure.airport.location.lat,
            lon: apiData.departure.airport.location.lon,
          } : undefined,
          times: {
            scheduled: apiData.departure?.scheduledTime?.utc || `${date}T00:00:00Z`,
            estimated: apiData.departure?.revisedTime?.utc || undefined,
            actual: apiData.departure?.actualTime?.utc || undefined,
          },
        },
        arrival: {
          name: apiData.arrival?.airport?.name || "Unknown",
          iata: apiData.arrival?.airport?.iata || "",
          city: apiData.arrival?.airport?.municipalityName || "",
          country: apiData.arrival?.airport?.countryCode || "",
          terminal: apiData.arrival?.terminal || undefined,
          gate: apiData.arrival?.gate || undefined,
          baggageClaim: apiData.arrival?.baggageBelt || undefined,
          location: apiData.arrival?.airport?.location?.lat ? {
            lat: apiData.arrival.airport.location.lat,
            lon: apiData.arrival.airport.location.lon,
          } : undefined,
          times: {
            scheduled: apiData.arrival?.scheduledTime?.utc || `${date}T00:00:00Z`,
            estimated: apiData.arrival?.revisedTime?.utc || undefined,
            actual: apiData.arrival?.actualTime?.utc || undefined,
          },
        },
        status: mapAeroDataBoxStatus(apiData.status),
        aircraft: apiData.aircraft
          ? {
            model: apiData.aircraft.model || undefined,
            registration: apiData.aircraft.reg || undefined,
          }
          : undefined,
        duration: calculateFlightDuration(
          apiData.departure?.scheduledTime?.utc,
          apiData.arrival?.scheduledTime?.utc,
          apiData.greatCircleDistance?.time
        ),
        lastApiUpdate: new Date().toISOString(),
      };

      return NextResponse.json({ found: true, flight });
    } catch (error) {
      console.error("AeroDataBox API error:", error);
      return NextResponse.json(
        { found: false, error: "API request failed" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(
    { found: false, error: "AeroDataBox API key is not configured. Add AERODATABOX_API_KEY to .env.local" },
    { status: 500 }
  );
}
