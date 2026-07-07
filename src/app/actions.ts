"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { findAirport } from "@/lib/airports";
import { getStore } from "@/lib/store";
import { scanWatches } from "@/lib/scan";
import type { FlightSegment, TripType } from "@/lib/types";

/** 顯示名稱：優先用中文機場名，查無代碼時退回代碼本身。 */
function zhName(code: string): string {
  return findAirport(code)?.zh ?? code;
}

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function code(formData: FormData, key: string): string {
  return str(formData, key).toUpperCase();
}

function dateOrNull(formData: FormData, key: string): string | null {
  const value = str(formData, key);
  return value || null;
}

export async function createWatchAction(formData: FormData) {
  const tripType = str(formData, "trip_type") as TripType;
  const frequency = parseInt(str(formData, "frequency_minutes"), 10) || 1440;
  // 每天模式才有掃描時刻（0–23，台灣時間）。
  const scanHourRaw = parseInt(str(formData, "scan_hour"), 10);
  const scanHour =
    frequency >= 1440 && Number.isFinite(scanHourRaw)
      ? Math.min(23, Math.max(0, scanHourRaw))
      : null;
  const maxPriceRaw = parseInt(str(formData, "max_price"), 10);
  const maxPrice = Number.isFinite(maxPriceRaw) && maxPriceRaw > 0 ? maxPriceRaw : null;

  let origin = code(formData, "origin");
  let destination: string | null = code(formData, "destination") || null;
  let segments: FlightSegment[] | null = null;

  if (tripType === "multi_city") {
    try {
      const parsed = JSON.parse(str(formData, "segments")) as FlightSegment[];
      segments = parsed
        .map((s) => ({
          origin: String(s.origin ?? "").trim().toUpperCase(),
          destination: String(s.destination ?? "").trim().toUpperCase(),
          depart_date: s.depart_date || null,
        }))
        .filter((s) => s.origin && s.destination);
    } catch {
      segments = null;
    }
    // 外站票 requires 4+ legs; the form enforces this client-side too.
    if (!segments || segments.length < 4) {
      redirect("/radar/new?error=segments");
    }
    origin = segments[0].origin;
    destination = null;
  } else if (!origin || !destination) {
    redirect("/radar/new?error=route");
  }

  const fallbackName =
    tripType === "multi_city" && segments
      ? `外站票 ${segments.map((s) => s.origin).join("→")}→${segments[segments.length - 1].destination}`
      : `${zhName(origin)} ${tripType === "round_trip" ? "⇄" : "→"} ${zhName(destination!)}`;

  await getStore().createWatch({
    name: str(formData, "name") || fallbackName,
    trip_type: tripType,
    origin,
    destination,
    depart_date: dateOrNull(formData, "depart_date"),
    return_date: tripType === "round_trip" ? dateOrNull(formData, "return_date") : null,
    segments,
    frequency_minutes: frequency,
    scan_hour: scanHour,
    max_price: maxPrice,
  });

  revalidatePath("/radar");
  revalidatePath("/");
  redirect("/radar");
}

export async function toggleWatchAction(id: string, currentStatus: string) {
  await getStore().updateWatch(id, {
    status: currentStatus === "active" ? "paused" : "active",
  });
  revalidatePath("/radar");
  revalidatePath("/");
}

export async function deleteWatchAction(id: string) {
  await getStore().deleteWatch(id);
  revalidatePath("/radar");
  revalidatePath("/");
}

export async function scanNowAction() {
  await scanWatches({ force: true });
  revalidatePath("/radar");
  revalidatePath("/");
}

const EMAIL_DOMAIN = "user.flygogo.app";

/**
 * 註冊：走 Admin API 建立帳號並直接標記已驗證 —
 * 不寄信、不受 Supabase 內建信箱限流、虛擬網域也不會被擋。
 */
export async function registerAction(
  username: string,
  password: string
): Promise<{ ok: boolean; error?: string }> {
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    return { ok: false, error: "帳號需為 3–20 個英數字或底線" };
  }
  if (password.length < 6) {
    return { ok: false, error: "密碼至少 6 個字元" };
  }

  const { getSupabaseAdminClient } = await import("@/lib/supabase/admin");
  const admin = getSupabaseAdminClient();
  if (!admin) {
    return {
      ok: false,
      error: "伺服器未設定 SUPABASE_SERVICE_ROLE_KEY，無法註冊",
    };
  }

  const { error } = await admin.auth.admin.createUser({
    email: `${username.toLowerCase()}@${EMAIL_DOMAIN}`,
    password,
    email_confirm: true,
  });

  if (error) {
    return {
      ok: false,
      error: error.message.includes("already been registered")
        ? "這個帳號已被註冊"
        : error.message,
    };
  }
  return { ok: true };
}

export async function signOutAction() {
  const { getSupabaseServerClient } = await import("@/lib/supabase/server");
  const supabase = await getSupabaseServerClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
  redirect("/login");
}
