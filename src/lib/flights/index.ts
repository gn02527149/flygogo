import type { FlightQuery, PriceQuote } from "./types";
import { getGoogleFlightsQuote } from "./google";
import { getMockQuote } from "./mock";

export type { FlightLeg, FlightQuery, PriceQuote } from "./types";

/**
 * Fetch the current best price for a query.
 * Uses Google Flights (via SerpApi) when SERPAPI_KEY is configured,
 * otherwise falls back to the built-in mock provider so the whole
 * scan/alert flow works out of the box.
 */
export async function getFlightQuote(query: FlightQuery): Promise<PriceQuote> {
  if (process.env.SERPAPI_KEY) {
    try {
      return await getGoogleFlightsQuote(query);
    } catch (err) {
      console.error(
        "[flights] google_flights failed, falling back to mock:",
        err instanceof Error ? err.message : err
      );
    }
  }
  return getMockQuote(query);
}
