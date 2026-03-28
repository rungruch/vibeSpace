// Flight tracking types

export type FlightStatus =
  | "scheduled"
  | "boarding"
  | "departed"
  | "in_air"
  | "landed"
  | "arrived"
  | "cancelled"
  | "delayed"
  | "diverted"
  | "unknown";

export interface AirportInfo {
  name: string;
  iata: string;
  city: string;
  country: string;
  terminal?: string;
  gate?: string;
  baggageClaim?: string;
}

export interface AirlineInfo {
  name: string;
  iata: string;
  logoUrl?: string;
}

export interface FlightTimes {
  scheduled: string; // ISO string
  estimated?: string;
  actual?: string;
}

export interface AircraftInfo {
  model?: string;
  registration?: string;
  iataCode?: string;
}

export interface Flight {
  id?: string; // Firestore document ID
  flightNumber: string; // e.g., "TG925"
  date: string; // departure date YYYY-MM-DD
  airline: AirlineInfo;
  departure: AirportInfo & { times: FlightTimes };
  arrival: AirportInfo & { times: FlightTimes };
  status: FlightStatus;
  aircraft?: AircraftInfo;
  duration?: number; // minutes
  lastApiUpdate?: string; // ISO string
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FlightNotification {
  id?: string;
  flightId: string;
  flightNumber: string;
  type: "status_change" | "delay" | "gate_change" | "cancellation" | "departure" | "landing";
  title: string;
  message: string;
  previousValue?: string;
  newValue?: string;
  read: boolean;
  createdAt: string;
}

export interface FlightSearchResult {
  found: boolean;
  flight?: Flight;
  error?: string;
}
