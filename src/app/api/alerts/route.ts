import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

// GET /api/alerts?unread=1 — list alerts (unread only when unread=1).
export async function GET(request: Request) {
  const unreadOnly = new URL(request.url).searchParams.get("unread") === "1";
  const alerts = await getStore().listAlerts(unreadOnly);
  return NextResponse.json({ alerts });
}

// PATCH /api/alerts { ids: string[] } — mark alerts as read (dismiss toast).
export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    ids?: string[];
  } | null;
  const ids = Array.isArray(body?.ids) ? body.ids.filter(Boolean) : [];
  await getStore().markAlertsRead(ids);
  return NextResponse.json({ ok: true });
}
