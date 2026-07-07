import { getFlightQuote, type FlightQuery } from "@/lib/flights";
import { getStore, type Store } from "@/lib/store";
import type { PriceSnapshot, RadarWatch } from "@/lib/types";

// Baseline alerts need at least this many same-month samples before firing,
// so a watch's first couple of scans don't produce noise.
const MIN_BASELINE_SAMPLES = 4;

export function watchToQuery(watch: RadarWatch): FlightQuery {
  if (watch.trip_type === "multi_city" && watch.segments?.length) {
    return { trip_type: "multi_city", legs: watch.segments };
  }
  const legs = [
    {
      origin: watch.origin,
      destination: watch.destination ?? "",
      depart_date: watch.depart_date,
    },
  ];
  if (watch.trip_type === "round_trip" && watch.destination) {
    legs.push({
      origin: watch.destination,
      destination: watch.origin,
      depart_date: watch.return_date,
    });
  }
  return {
    trip_type: watch.trip_type,
    legs,
    return_date: watch.return_date,
  };
}

/** Average of same-calendar-month snapshots (任一年份的當月), or null. */
export function monthlyAverage(
  snapshots: PriceSnapshot[],
  now = new Date()
): { average: number; samples: number } | null {
  const month = now.getMonth();
  const prices = snapshots
    .filter((s) => new Date(s.seen_at).getMonth() === month)
    .map((s) => s.price);
  if (prices.length === 0) return null;
  const average = Math.round(
    prices.reduce((sum, p) => sum + p, 0) / prices.length
  );
  return { average, samples: prices.length };
}

// 台灣時區偏移（UTC+8，無夏令時間）。
const TAIPEI_OFFSET_MS = 8 * 3_600_000;
const DAY_MS = 86_400_000;

function isDue(watch: RadarWatch, now: number): boolean {
  if (!watch.last_scanned_at) return true;
  const last = Date.parse(watch.last_scanned_at);

  // 每天一次且有指定時刻：找出最近一次「已到」的排程時間點
  // （台灣時間今天 scan_hour 點；還沒到就是昨天的），上次掃描早於它即到期。
  if (watch.frequency_minutes >= 1440 && watch.scan_hour != null) {
    const taipeiNow = now + TAIPEI_OFFSET_MS;
    let scheduled =
      Math.floor(taipeiNow / DAY_MS) * DAY_MS +
      watch.scan_hour * 3_600_000 -
      TAIPEI_OFFSET_MS;
    if (scheduled > now) {
      scheduled -= DAY_MS;
    }
    return last < scheduled;
  }

  return now - last >= watch.frequency_minutes * 60_000;
}

export type ScanResult = {
  scanned: number;
  alerts: number;
};

/**
 * Scan all active watches that are due per their frequency_minutes
 * (or every active watch when `force` is true). For each: fetch a quote,
 * record a snapshot, and raise an alert when the price undercuts the
 * same-month average baseline or the watch's max_price threshold.
 */
export async function scanWatches({
  force = false,
  // 預設走使用者 session store；cron 排程傳入 admin store 掃全部人。
  store = getStore(),
}: { force?: boolean; store?: Store } = {}): Promise<ScanResult> {
  const now = Date.now();
  const watches = await store.listWatches();
  const unread = await store.listAlerts(true);
  // One live alert per watch at a time — don't stack duplicates every scan.
  const alreadyAlerted = new Set(unread.map((a) => a.watch_id));

  let scanned = 0;
  let alerts = 0;

  for (const watch of watches) {
    if (watch.status !== "active") continue;
    if (!force && !isDue(watch, now)) continue;

    let quote;
    try {
      quote = await getFlightQuote(watchToQuery(watch));
    } catch (err) {
      console.error(`[scan] ${watch.name}:`, err);
      continue;
    }

    await store.addSnapshot({
      watch_id: watch.id,
      user_id: watch.user_id,
      price: quote.price,
      currency: quote.currency,
      options: quote.options.length ? quote.options : null,
    });
    await store.updateWatch(watch.id, {
      last_scanned_at: new Date().toISOString(),
    });
    scanned++;

    if (alreadyAlerted.has(watch.id)) continue;

    const snapshots = await store.listSnapshots(watch.id);
    const baseline = monthlyAverage(snapshots);

    const belowBaseline =
      baseline !== null &&
      baseline.samples >= MIN_BASELINE_SAMPLES &&
      quote.price < baseline.average;
    const belowThreshold =
      watch.max_price !== null && quote.price < watch.max_price;

    if (belowBaseline || belowThreshold) {
      const message = belowBaseline
        ? `目前 TWD ${quote.price.toLocaleString()}，低於當月平均 TWD ${baseline.average.toLocaleString()}`
        : `目前 TWD ${quote.price.toLocaleString()}，低於設定門檻 TWD ${watch.max_price?.toLocaleString()}`;
      await store.createAlert({
        watch_id: watch.id,
        user_id: watch.user_id,
        watch_name: watch.name,
        price: quote.price,
        baseline: belowBaseline ? baseline.average : null,
        message,
        // 達標時列出最低的三個航班。
        options: quote.options.slice(0, 3),
      });
      alreadyAlerted.add(watch.id);
      alerts++;
    }
  }

  return { scanned, alerts };
}
