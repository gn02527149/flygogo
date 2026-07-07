import type { FlightOption } from "@/lib/types";
import type { FlightQuery, PriceQuote } from "./types";

// Google Flights adapter via SerpApi's google_flights engine.
// (Google does not offer an official public Flights API; SerpApi is the
// common bridge. Set SERPAPI_KEY in .env.local to activate this provider.)
// Docs: https://serpapi.com/google-flights-api

const ENDPOINT = "https://serpapi.com/search.json";

function defaultDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export async function getGoogleFlightsQuote(
  query: FlightQuery
): Promise<PriceQuote> {
  const key = process.env.SERPAPI_KEY;
  if (!key) {
    throw new Error("SERPAPI_KEY not set");
  }

  const params = new URLSearchParams({
    engine: "google_flights",
    api_key: key,
    currency: "TWD",
    hl: "zh-TW",
  });

  const first = query.legs[0];
  if (!first) {
    throw new Error("query has no legs");
  }

  if (query.trip_type === "multi_city") {
    // 外站票: 4+ legs via multi_city_json.
    params.set("type", "3");
    params.set(
      "multi_city_json",
      JSON.stringify(
        query.legs.map((leg, i) => ({
          departure_id: leg.origin,
          arrival_id: leg.destination,
          date: leg.depart_date ?? defaultDate(30 + i * 3),
        }))
      )
    );
  } else {
    params.set("departure_id", first.origin);
    params.set("arrival_id", first.destination);
    params.set("outbound_date", first.depart_date ?? defaultDate(30));
    if (query.trip_type === "round_trip") {
      params.set("type", "1");
      params.set("return_date", query.return_date ?? defaultDate(37));
    } else {
      params.set("type", "2");
    }
  }

  const res = await fetch(`${ENDPOINT}?${params.toString()}`, {
    // Quotes are point-in-time; never serve a cached price to the scanner.
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`SerpApi HTTP ${res.status}`);
  }

  const json = await res.json();
  const options = parseOptions(json);

  if (options.length === 0) {
    // Fall back to the aggregate insight price when itineraries are missing.
    const lowest: unknown = json?.price_insights?.lowest_price;
    if (typeof lowest !== "number") {
      throw new Error("no price in Google Flights response");
    }
    return {
      price: Math.round(lowest),
      currency: "TWD",
      provider: "google_flights",
      options: [],
    };
  }

  return {
    price: options[0].price,
    currency: "TWD",
    provider: "google_flights",
    options,
  };
}

// SerpApi itinerary shape (subset we consume).
type SerpFlight = {
  price?: number;
  total_duration?: number;
  flights?: {
    airline?: string;
    flight_number?: string;
    departure_airport?: { time?: string };
    arrival_airport?: { time?: string };
  }[];
};

/** "2026-08-06 07:45" → "08/06 07:45" (falls back to the raw string). */
function shortTime(raw: string | undefined): string {
  if (!raw) return "";
  const match = raw.match(/^\d{4}-(\d{2})-(\d{2})[ T](\d{2}:\d{2})/);
  return match ? `${match[1]}/${match[2]} ${match[3]}` : raw;
}

function parseOptions(json: unknown): FlightOption[] {
  const data = json as {
    best_flights?: SerpFlight[];
    other_flights?: SerpFlight[];
  };
  const itineraries = [
    ...(data.best_flights ?? []),
    ...(data.other_flights ?? []),
  ];

  return itineraries
    .filter((f) => typeof f.price === "number" && f.flights?.length)
    .map((f) => {
      const legs = f.flights ?? [];
      const first = legs[0];
      const last = legs[legs.length - 1];
      return {
        airline: first?.airline ?? "—",
        flight_number: legs
          .map((l) => l.flight_number)
          .filter(Boolean)
          .join(" / "),
        depart_time: shortTime(first?.departure_airport?.time),
        arrive_time: shortTime(last?.arrival_airport?.time),
        duration_minutes: f.total_duration ?? null,
        // Google Flights 結果不含行李額度；之後可依航空公司對照表補上。
        carry_on_kg: null,
        checked_kg: null,
        price: Math.round(f.price as number),
      };
    })
    .sort((a, b) => a.price - b.price)
    .slice(0, 5);
}
