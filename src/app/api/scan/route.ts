import { NextResponse } from "next/server";
import { scanWatches } from "@/lib/scan";

export const dynamic = "force-dynamic";

// Scan tick. The AlertToaster polls this while the app is open, which gives
// each watch its frequency-based scanning without a separate cron process.
// POST /api/scan?force=1 rescans every active watch regardless of schedule.
export async function POST(request: Request) {
  const force = new URL(request.url).searchParams.get("force") === "1";
  const result = await scanWatches({ force });
  return NextResponse.json(result);
}
