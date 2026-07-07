// Domain types mirroring the Supabase schema (see supabase/schema.sql).
// The in-memory demo store (src/lib/store/memory.ts) uses the same shapes.

export type DestinationGroup = {
  id: string;
  name: string;
  description: string | null;
  // IATA airport / city codes that belong to this group, e.g. ["NRT", "HND"].
  airport_codes: string[];
  created_at: string;
};

export type RadarWatchStatus = "active" | "paused";

export type TripType = "one_way" | "round_trip" | "multi_city";

export type FlightSegment = {
  origin: string;
  destination: string;
  depart_date: string | null;
};

export type RadarWatch = {
  id: string;
  name: string;
  // Optional link to a destination group; null means an ad-hoc watch.
  destination_group_id: string | null;
  trip_type: TripType;
  origin: string;
  // Direct airport-to-airport watch target. Null for multi_city (see segments).
  destination: string | null;
  depart_date: string | null;
  return_date: string | null;
  // multi_city (外站票) legs, 4+ segments. Null for one_way / round_trip.
  segments: FlightSegment[] | null;
  // How often the radar re-checks the price.
  frequency_minutes: number;
  // Optional hard threshold (TWD); alert immediately when price drops below it.
  max_price: number | null;
  status: RadarWatchStatus;
  last_scanned_at: string | null;
  created_at: string;
};

// One bookable itinerary option observed during a scan.
export type FlightOption = {
  airline: string;
  flight_number: string;
  // Display strings, e.g. "08/06 07:45". Multi-leg: first departure / last arrival.
  depart_time: string;
  arrive_time: string;
  duration_minutes: number | null;
  // Baggage allowance; null = not included / unknown.
  carry_on_kg: number | null;
  checked_kg: number | null;
  price: number;
};

export type PriceSnapshot = {
  id: string;
  watch_id: string;
  price: number;
  currency: string;
  // Cheapest few itineraries seen in this scan (sorted by price asc).
  options: FlightOption[] | null;
  seen_at: string;
};

export type PriceAlert = {
  id: string;
  watch_id: string;
  watch_name: string;
  price: number;
  // The monthly-average baseline the price undercut. Null for max_price hits.
  baseline: number | null;
  message: string;
  // The 3 cheapest itineraries at alert time.
  options: FlightOption[] | null;
  read: boolean;
  created_at: string;
};

export type RadarTarget = {
  id: string;
  watch_id: string;
  origin: string;
  destination: string;
  depart_date: string | null;
  return_date: string | null;
  last_price: number | null;
  last_checked_at: string | null;
  created_at: string;
};
