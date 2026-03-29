import { Flight, FlightSearchResult } from "@/types/flight";

// Demo flight data for development without API key
const MOCK_FLIGHTS: Record<string, Flight> = {
  "TG925": {
    flightNumber: "TG925",
    date: "2026-04-15",
    airline: { name: "Thai Airways", iata: "TG" },
    departure: {
      name: "Suvarnabhumi Airport",
      iata: "BKK",
      city: "Bangkok",
      country: "Thailand",
      terminal: "Main",
      gate: "D5",
      location: { lat: 13.6900, lon: 100.7501 },
      times: {
        scheduled: "2026-04-15T23:50:00+07:00",
        estimated: "2026-04-16T00:10:00+07:00",
      },
    },
    arrival: {
      name: "Narita International Airport",
      iata: "NRT",
      city: "Tokyo",
      country: "Japan",
      terminal: "1",
      gate: "42A",
      baggageClaim: "Belt 3",
      location: { lat: 35.7720, lon: 140.3929 },
      times: {
        scheduled: "2026-04-16T07:30:00+09:00",
        estimated: "2026-04-16T07:45:00+09:00",
      },
    },
    status: "scheduled",
    aircraft: { model: "Boeing 787-9", registration: "HS-TWA" },
    duration: 360,
  },
  "SQ317": {
    flightNumber: "SQ317",
    date: "2026-04-10",
    airline: { name: "Singapore Airlines", iata: "SQ" },
    departure: {
      name: "Singapore Changi Airport",
      iata: "SIN",
      city: "Singapore",
      country: "Singapore",
      terminal: "3",
      gate: "B12",
      location: { lat: 1.3644, lon: 103.9915 },
      times: {
        scheduled: "2026-04-10T08:25:00+08:00",
      },
    },
    arrival: {
      name: "London Heathrow Airport",
      iata: "LHR",
      city: "London",
      country: "United Kingdom",
      terminal: "2",
      gate: "C55",
      baggageClaim: "Belt 7",
      location: { lat: 51.4700, lon: -0.4543 },
      times: {
        scheduled: "2026-04-10T14:35:00+01:00",
      },
    },
    status: "scheduled",
    aircraft: { model: "Airbus A380-800", registration: "9V-SKA" },
    duration: 790,
  },
  "EK384": {
    flightNumber: "EK384",
    date: "2026-03-25",
    airline: { name: "Emirates", iata: "EK" },
    departure: {
      name: "Suvarnabhumi Airport",
      iata: "BKK",
      city: "Bangkok",
      country: "Thailand",
      terminal: "Main",
      gate: "E8",
      location: { lat: 13.6900, lon: 100.7501 },
      times: {
        scheduled: "2026-03-25T01:50:00+07:00",
        actual: "2026-03-25T02:05:00+07:00",
      },
    },
    arrival: {
      name: "Dubai International Airport",
      iata: "DXB",
      city: "Dubai",
      country: "UAE",
      terminal: "3",
      gate: "A14",
      baggageClaim: "Belt 12",
      location: { lat: 25.2532, lon: 55.3657 },
      times: {
        scheduled: "2026-03-25T05:10:00+04:00",
        actual: "2026-03-25T05:22:00+04:00",
      },
    },
    status: "landed",
    aircraft: { model: "Boeing 777-300ER", registration: "A6-EGK" },
    duration: 380,
  },
  "JL707": {
    flightNumber: "JL707",
    date: "2026-03-20",
    airline: { name: "Japan Airlines", iata: "JL" },
    departure: {
      name: "Narita International Airport",
      iata: "NRT",
      city: "Tokyo",
      country: "Japan",
      terminal: "2",
      gate: "71",
      location: { lat: 35.7720, lon: 140.3929 },
      times: {
        scheduled: "2026-03-20T10:00:00+09:00",
        actual: "2026-03-20T10:00:00+09:00",
      },
    },
    arrival: {
      name: "Suvarnabhumi Airport",
      iata: "BKK",
      city: "Bangkok",
      country: "Thailand",
      terminal: "Main",
      gate: "C4",
      baggageClaim: "Belt 5",
      location: { lat: 13.6900, lon: 100.7501 },
      times: {
        scheduled: "2026-03-20T14:30:00+07:00",
        actual: "2026-03-20T14:18:00+07:00",
      },
    },
    status: "arrived",
    aircraft: { model: "Boeing 787-8", registration: "JA837J" },
    duration: 390,
  },
  "CX700": {
    flightNumber: "CX700",
    date: "2026-04-02",
    airline: { name: "Cathay Pacific", iata: "CX" },
    departure: {
      name: "Hong Kong International Airport",
      iata: "HKG",
      city: "Hong Kong",
      country: "China",
      terminal: "1",
      gate: "23",
      location: { lat: 22.3080, lon: 113.9185 },
      times: {
        scheduled: "2026-04-02T09:15:00+08:00",
        estimated: "2026-04-02T09:15:00+08:00",
      },
    },
    arrival: {
      name: "Suvarnabhumi Airport",
      iata: "BKK",
      city: "Bangkok",
      country: "Thailand",
      terminal: "Main",
      gate: "G7",
      baggageClaim: "Belt 2",
      location: { lat: 13.6900, lon: 100.7501 },
      times: {
        scheduled: "2026-04-02T11:15:00+07:00",
        estimated: "2026-04-02T11:10:00+07:00",
      },
    },
    status: "delayed",
    aircraft: { model: "Airbus A350-900", registration: "B-LRA" },
    duration: 180,
  },
  "AA100": {
    flightNumber: "AA100",
    date: "2026-04-20",
    airline: { name: "American Airlines", iata: "AA" },
    departure: {
      name: "John F. Kennedy International Airport",
      iata: "JFK",
      city: "New York",
      country: "United States",
      terminal: "8",
      gate: "B42",
      location: { lat: 40.6413, lon: -73.7781 },
      times: {
        scheduled: "2026-04-20T19:00:00-04:00",
      },
    },
    arrival: {
      name: "London Heathrow Airport",
      iata: "LHR",
      city: "London",
      country: "United Kingdom",
      terminal: "5",
      gate: "A10",
      location: { lat: 51.4700, lon: -0.4543 },
      times: {
        scheduled: "2026-04-21T07:00:00+01:00",
      },
    },
    status: "scheduled",
    aircraft: { model: "Boeing 777-300ER", registration: "N720AN" },
    duration: 420,
  },
};

// Simulate status changes for demo mode
let statusCycleIndex = 0;
const STATUS_CYCLES = ["scheduled", "delayed", "boarding", "departed", "in_air", "landed", "arrived"] as const;

export function searchFlightMock(flightNumber: string, _date: string): FlightSearchResult {
  const normalizedInput = flightNumber.toUpperCase().replace(/\s+/g, "");
  const flight = MOCK_FLIGHTS[normalizedInput];

  if (flight) {
    return {
      found: true,
      flight: {
        ...flight,
        date: _date,
        lastApiUpdate: new Date().toISOString(),
      },
    };
  }

  // Generate a random flight for unknown flight numbers if format is valid (2 letters + numbers)
  const flightRegex = /^[A-Z]{2}\d{1,4}$/;
  if (flightRegex.test(normalizedInput)) {
    const randomFlight: Flight = {
      flightNumber: normalizedInput,
      date: _date,
      airline: { name: "Demo Airline", iata: normalizedInput.substring(0, 2) },
      departure: {
        name: "Demo Airport",
        iata: "DEM",
        city: "Demo City",
        country: "Demo Country",
        terminal: "1",
        gate: "A1",
        location: { lat: 37.7749, lon: -122.4194 },
        times: { scheduled: `${_date}T10:00:00Z` },
      },
      arrival: {
        name: "Arrival Airport",
        iata: "ARR",
        city: "Arrival City",
        country: "Arrival Country",
        terminal: "2",
        gate: "B2",
        location: { lat: 51.5074, lon: -0.1278 },
        times: { scheduled: `${_date}T14:00:00Z` },
      },
      status: "scheduled",
      aircraft: { model: "Boeing 737-800" },
      duration: 240,
      lastApiUpdate: new Date().toISOString(),
    };
    return { found: true, flight: randomFlight };
  }

  return { found: false, error: "Flight not found. Try: TG925, SQ317, EK384, JL707, CX700, AA100" };
}

export function refreshFlightStatusMock(flight: Flight): Flight {
  // Simulate random status updates for demo
  const now = new Date();
  const mockRef = MOCK_FLIGHTS[flight.flightNumber];
  
  const departureDate = new Date(flight.departure.times.scheduled);
  const arrivalDate = new Date(flight.arrival.times.scheduled);

  let newStatus = flight.status;

  if (departureDate > now) {
    // Flight in the future — randomly delay or keep scheduled
    newStatus = Math.random() > 0.7 ? "delayed" : "scheduled";
  } else if (arrivalDate < now) {
    newStatus = "arrived";
  } else {
    // Flight should be active
    newStatus = "in_air";
  }

  return {
    ...flight,
    departure: {
      ...flight.departure,
      location: flight.departure.location || mockRef?.departure.location
    },
    arrival: {
      ...flight.arrival,
      location: flight.arrival.location || mockRef?.arrival.location
    },
    status: newStatus,
    lastApiUpdate: now.toISOString(),
  };
}

export const DEMO_FLIGHT_NUMBERS = Object.keys(MOCK_FLIGHTS);
