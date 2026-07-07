import type { FlightOption } from "@/lib/types";
import type { FlightQuery, PriceQuote } from "./types";
import { routeKey } from "./types";

// Deterministic-ish mock quotes so the whole scan → baseline → alert flow is
// testable without any API key. Each route gets a stable base price; the live
// quote oscillates around it (±~25%) so below-average alerts do fire.
// Each quote also carries realistic itinerary options (airline / flight number
// / times / baggage) so detail UI is exercised end to end.

const AIRLINES = [
  { name: "中華航空", code: "CI", factor: 1.06, carryOn: 7, checked: 23 },
  { name: "長榮航空", code: "BR", factor: 1.1, carryOn: 7, checked: 23 },
  { name: "星宇航空", code: "JX", factor: 1.08, carryOn: 7, checked: 23 },
  { name: "台灣虎航", code: "IT", factor: 0.78, carryOn: 10, checked: null },
  { name: "酷航", code: "TR", factor: 0.82, carryOn: 10, checked: null },
  { name: "樂桃航空", code: "MM", factor: 0.8, carryOn: 7, checked: null },
];

function hashCode(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function mockBasePrice(query: FlightQuery): number {
  const key = routeKey(query);
  const perLeg = 3500 + (hashCode(key) % 6500);
  // Multi-leg itineraries scale sub-linearly, like real fares tend to.
  return Math.round(perLeg * (0.6 + 0.4 * query.legs.length));
}

function two(n: number): string {
  return String(n).padStart(2, "0");
}

/** e.g. "08/06 07:45" */
function displayTime(dateStr: string | null, hour: number, minute: number): string {
  const d = dateStr ? new Date(dateStr) : new Date(Date.now() + 30 * 86_400_000);
  return `${two(d.getMonth() + 1)}/${two(d.getDate())} ${two(hour)}:${two(minute)}`;
}

/**
 * Build sorted itinerary options around an adjusted base price.
 * Exported so the demo seed data can reuse the same generator.
 */
export function buildMockOptions(
  query: FlightQuery,
  adjustedBase: number
): FlightOption[] {
  const hash = hashCode(routeKey(query));
  const legCount = query.legs.length;
  const departDate = query.legs[0]?.depart_date ?? null;

  const options = AIRLINES
    // Vary which airlines serve the route so lists differ per route.
    .filter((_, i) => (hash + i) % 7 !== 0)
    .map((airline, i) => {
      const jitter = (Math.random() - 0.5) * 0.16;
      const price = Math.max(
        500,
        Math.round(adjustedBase * airline.factor * (1 + jitter))
      );
      const departHour = 6 + ((hash + i * 5) % 16);
      const departMinute = ((hash + i * 3) % 4) * 15;
      const durationMinutes = legCount * (140 + ((hash + i * 11) % 160));
      const arriveTotal = departHour * 60 + departMinute + durationMinutes;
      const flightNumber = `${airline.code}${100 + ((hash + i * 7) % 800)}`;
      return {
        airline: airline.name,
        flight_number:
          legCount > 1 ? `${flightNumber} 等${legCount}段` : flightNumber,
        depart_time: displayTime(departDate, departHour, departMinute),
        arrive_time: displayTime(
          departDate,
          Math.floor(arriveTotal / 60) % 24,
          arriveTotal % 60
        ),
        duration_minutes: durationMinutes,
        carry_on_kg: airline.carryOn,
        checked_kg: airline.checked,
        price,
      };
    })
    .sort((a, b) => a.price - b.price);

  return options.slice(0, 5);
}

export async function getMockQuote(query: FlightQuery): Promise<PriceQuote> {
  const base = mockBasePrice(query);
  const phase = hashCode(routeKey(query)) % 12;
  // Slow hourly wave + per-scan jitter.
  const wave = Math.sin(Date.now() / 3_600_000 + phase) * 0.12;
  const jitter = (Math.random() - 0.5) * 0.24;
  const adjusted = Math.max(500, Math.round(base * (1 + wave + jitter)));
  const options = buildMockOptions(query, adjusted);
  return {
    price: options[0].price,
    currency: "TWD",
    provider: "mock",
    options,
  };
}
