"use client";

import { useMemo } from "react";
import { Map, Marker, Source, Layer } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { Flight } from "@/types/flight";
import { MapPin, Plane } from "lucide-react";
import { useTheme } from "next-themes";
import greatCircle from "@turf/great-circle";
import { point } from "@turf/helpers";

interface FlightMapProps {
  flight: Flight;
}

export function FlightMap({ flight }: FlightMapProps) {
  const { theme } = useTheme();

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  const origin = flight.departure.location;
  const dest = flight.arrival.location;

  // All hooks MUST be called before any early returns (Rules of Hooks)
  const routeArc = useMemo(() => {
    if (!origin || !dest) return null;
    const start = point([origin.lon, origin.lat]);
    const end = point([dest.lon, dest.lat]);
    return greatCircle(start, end, { npoints: 100 });
  }, [origin, dest]);

  const mapStyle = theme === "dark"
    ? "mapbox://styles/mapbox/dark-v11"
    : "mapbox://styles/mapbox/light-v11";

  const isActive = ["scheduled", "boarding", "departed", "in_air", "delayed"].includes(flight.status);

  // --- Early returns AFTER all hooks ---

  if (!token) {
    return (
      <div className="w-full h-64 sm:h-80 bg-slate-100 dark:bg-slate-800/50 rounded-2xl flex flex-col items-center justify-center p-6 border border-slate-200 dark:border-slate-800 text-center">
        <MapPin className="w-10 h-10 text-slate-400 mb-3" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Map View Unavailable</h3>
        <p className="text-sm text-slate-500 max-w-sm mt-1">
          To see the interactive flight path, please add your Mapbox token to <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-xs">.env.local</code> as <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-xs">NEXT_PUBLIC_MAPBOX_TOKEN</code>
        </p>
      </div>
    );
  }

  if (!origin || !dest || !routeArc) {
    return (
      <div className="w-full h-64 sm:h-80 bg-slate-100 dark:bg-slate-800/50 rounded-2xl flex flex-col items-center justify-center border border-slate-200 dark:border-slate-800">
        <MapPin className="w-10 h-10 text-slate-400 mb-2" />
        <p className="text-sm text-slate-500">Flight coordinates unavailable</p>
      </div>
    );
  }

  const centerLon = (origin.lon + dest.lon) / 2;
  const centerLat = (origin.lat + dest.lat) / 2;

  const bounds: [number, number, number, number] = [
    Math.min(origin.lon, dest.lon) - 5,
    Math.min(origin.lat, dest.lat) - 5,
    Math.max(origin.lon, dest.lon) + 5,
    Math.max(origin.lat, dest.lat) + 5,
  ];

  return (
    <div className="w-full h-[300px] sm:h-[400px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm relative">
      <Map
        mapboxAccessToken={token}
        initialViewState={{
          longitude: centerLon,
          latitude: centerLat,
          zoom: 2,
          bounds: bounds,
          fitBoundsOptions: { padding: 40 },
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={mapStyle}
        attributionControl={false}
      >
        <Source id="route" type="geojson" data={routeArc}>
          <Layer
            id="route-line"
            type="line"
            paint={{
              "line-color": theme === "dark" ? "#38bdf8" : "#0ea5e9",
              "line-width": 3,
              "line-dasharray": [2, 3],
              "line-opacity": isActive ? 0.8 : 0.4,
            }}
          />
        </Source>

        <Marker longitude={origin.lon} latitude={origin.lat} anchor="bottom">
          <div className="flex flex-col items-center">
            <div className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full shadow-md mb-1">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{flight.departure.iata}</span>
            </div>
            <div className="w-3 h-3 bg-slate-400 dark:bg-slate-500 rounded-full border-2 border-white dark:border-slate-800" />
          </div>
        </Marker>

        <Marker longitude={dest.lon} latitude={dest.lat} anchor="bottom">
          <div className="flex flex-col items-center">
            <div className="px-2 py-1 bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 rounded-full shadow-md mb-1">
              <span className="text-xs font-bold text-sky-600 dark:text-sky-400">{flight.arrival.iata}</span>
            </div>
            <div className={`w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 ${isActive ? "bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.8)]" : "bg-slate-400 dark:bg-slate-500"}`} />
          </div>
        </Marker>

        {flight.status === "in_air" && flight.liveLocation && (
          <Marker
            longitude={flight.liveLocation.lon}
            latitude={flight.liveLocation.lat}
            anchor="center"
          >
            <div className="group relative flex items-center justify-center">
              <div
                className="w-9 h-9 rounded-full bg-sky-500 shadow-lg shadow-sky-500/50 flex items-center justify-center ring-2 ring-white dark:ring-slate-900 cursor-pointer"
                style={{ transform: `rotate(${flight.liveLocation.heading ?? 0}deg)` }}
              >
                <Plane className="w-4 h-4 text-white" />
              </div>
              {(flight.liveLocation.altitude != null || flight.liveLocation.groundSpeed != null) && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center pointer-events-none z-10">
                  <div className="bg-slate-900 dark:bg-slate-800 text-white text-xs rounded-lg px-3 py-2 shadow-xl whitespace-nowrap space-y-0.5">
                    {flight.liveLocation.altitude != null && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">Alt</span>
                        <span className="font-semibold">{Math.round(flight.liveLocation.altitude).toLocaleString()} ft</span>
                      </div>
                    )}
                    {flight.liveLocation.groundSpeed != null && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">Spd</span>
                        <span className="font-semibold">{Math.round(flight.liveLocation.groundSpeed)} kts</span>
                      </div>
                    )}
                  </div>
                  <div className="w-2 h-2 bg-slate-900 dark:bg-slate-800 rotate-45 -mt-1" />
                </div>
              )}
            </div>
          </Marker>
        )}
      </Map>
    </div>
  );
}
