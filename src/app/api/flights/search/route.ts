import { NextRequest, NextResponse } from "next/server";
import { searchFlightMock } from "@/lib/mockFlightData";
import { FlightStatus } from "@/types/flight";

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

  const apiKey = process.env.AERODATABOX_API_KEY;

  // Use real API if key is configured
  if (apiKey) {
    try {
      const response = await fetch(
        `https://aerodatabox.p.rapidapi.com/flights/number/${encodeURIComponent(flightNumber)}/${date}`,
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
      const flight = {
        flightNumber: `${apiData.airline?.iata || ""}${apiData.number || flightNumber}`,
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
        duration: apiData.greatCircleDistance?.time || undefined,
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

  // Fallback to mock data
  const result = searchFlightMock(flightNumber, date);
  return NextResponse.json(result);
}

function mapAeroDataBoxStatus(status: string | undefined): FlightStatus {
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
