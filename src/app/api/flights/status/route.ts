import { NextRequest, NextResponse } from "next/server";

import { Flight, FlightStatus } from "@/types/flight";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { flight } = body as { flight: Flight };

    if (!flight || !flight.flightNumber) {
      return NextResponse.json(
        { error: "Missing flight data" },
        { status: 400 }
      );
    }

    const apiKey = process.env.AERODATABOX_API_KEY;

    if (apiKey) {
      try {
        const response = await fetch(
          `https://aerodatabox.p.rapidapi.com/flights/number/${encodeURIComponent(flight.flightNumber)}/${flight.date}`,
          {
            headers: {
              "x-rapidapi-key": apiKey,
              "x-rapidapi-host": "aerodatabox.p.rapidapi.com",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const apiData = Array.isArray(data) ? data[0] : data;

          if (apiData) {
            const updatedFlight: Partial<Flight> = {
              status: mapStatus(apiData.status),
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
          }
        }
      } catch (error) {
        console.error("AeroDataBox status refresh error:", error);
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

function mapStatus(status: string | undefined): FlightStatus {
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
