import type { FlightOption, TripType } from "@/lib/types";

export type FlightLeg = {
  origin: string;
  destination: string;
  depart_date: string | null;
};

export type FlightQuery = {
  trip_type: TripType;
  legs: FlightLeg[];
  return_date?: string | null;
};

export type PriceQuote = {
  price: number;
  currency: string;
  provider: "google_flights" | "mock";
  // Itinerary options seen in this scan, sorted by price asc. price === options[0].price.
  options: FlightOption[];
};

export function routeKey(query: FlightQuery): string {
  return (
    query.legs.map((l) => `${l.origin}-${l.destination}`).join("|") +
    `#${query.trip_type}`
  );
}
