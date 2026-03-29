import { NextRequest, NextResponse } from "next/server";

import { Flight } from "@/types/flight";
import { mapAeroDataBoxStatus } from "@/lib/flightUtils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { flight } = body as { flight: Flight };

    if (!flight || !flight.flightNumber || !flight.date) {
      return NextResponse.json(
        { error: "Missing flight data" },
        { status: 400 }
      );
    }

    // 1. Simple Frontend Token Check
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Input sanitization for `date`
    if (!/^\d{4}-\d{2}-\d{2}$/.test(flight.date)) {
      return NextResponse.json({ error: "Invalid date format. Expected YYYY-MM-DD" }, { status: 400 });
    }
    const safeDate = encodeURIComponent(flight.date);

    const apiKey = process.env.AERODATABOX_API_KEY;

    if (apiKey) {
      try {
        const response = await fetch(
          `https://aerodatabox.p.rapidapi.com/flights/number/${encodeURIComponent(flight.flightNumber)}/${safeDate}`,
          {
            headers: {
              "x-rapidapi-key": apiKey,
              "x-rapidapi-host": "aerodatabox.p.rapidapi.com",
            },
          }
        );

        if (!response.ok) {
          return NextResponse.json(
            { error: `AeroDataBox API error: ${response.status}` },
            { status: response.status === 404 ? 404 : 502 }
          );
        }

        const data = await response.json();
        const apiData = Array.isArray(data) ? data[0] : data;

        if (!apiData) {
          return NextResponse.json({ error: "Flight not found" }, { status: 404 });
        }

        const updatedFlight: Partial<Flight> = {
          status: mapAeroDataBoxStatus(apiData.status),
          lastApiUpdate: new Date().toISOString(),
        };

        // Update departure info if available
        if (apiData.departure) {
          updatedFlight.departure = {
            ...flight.departure,
            terminal: apiData.departure.terminal || flight.departure.terminal,
            gate: apiData.departure.gate || flight.departure.gate,
            times: {
              ...flight.departure.times,
              estimated: apiData.departure.revisedTime?.utc || flight.departure.times.estimated,
              actual: apiData.departure.actualTime?.utc || flight.departure.times.actual,
            },
            location: apiData.departure?.airport?.location?.lat ? {
              lat: apiData.departure.airport.location.lat,
              lon: apiData.departure.airport.location.lon,
            } : flight.departure.location,
          };
        }

        // Update arrival info if available
        if (apiData.arrival) {
          updatedFlight.arrival = {
            ...flight.arrival,
            terminal: apiData.arrival.terminal || flight.arrival.terminal,
            gate: apiData.arrival.gate || flight.arrival.gate,
            baggageClaim: apiData.arrival.baggageBelt || flight.arrival.baggageClaim,
            times: {
              ...flight.arrival.times,
              estimated: apiData.arrival.revisedTime?.utc || flight.arrival.times.estimated,
              actual: apiData.arrival.actualTime?.utc || flight.arrival.times.actual,
            },
            location: apiData.arrival?.airport?.location?.lat ? {
              lat: apiData.arrival.airport.location.lat,
              lon: apiData.arrival.airport.location.lon,
            } : flight.arrival.location,
          };
        }

        return NextResponse.json({
          updated: true,
          changes: updatedFlight,
          previousStatus: flight.status,
          newStatus: updatedFlight.status,
        });
      } catch (error) {
        console.error("AeroDataBox status refresh error:", error);
        return NextResponse.json(
          { error: "AeroDataBox API request failed" },
          { status: 502 }
        );
      }
    }

    return NextResponse.json(
      { error: "AeroDataBox API key is not configured" },
      { status: 500 }
    );
  } catch (error) {
    console.error("Status refresh error:", error);
    return NextResponse.json({ error: "Failed to refresh status" }, { status: 500 });
  }
}
