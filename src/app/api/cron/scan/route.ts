import { NextResponse } from "next/server";
import { scanWatches } from "@/lib/scan";
import { supabaseAdminStore } from "@/lib/store/supabase";

export const dynamic = "force-dynamic";
// 一次掃多條航線 + 打外部 API，放寬執行時間上限。
export const maxDuration = 60;

// 排程掃描端點：以 service role 掃「全部使用者」的到期守望，
// 不依賴任何人開著網頁。由 Vercel Cron（或外部排程器）呼叫。
//
// 驗證：設定 CRON_SECRET 環境變數後，請求需帶
//   Authorization: Bearer <CRON_SECRET>
// （Vercel Cron 會自動帶上）。未設定 CRON_SECRET 時不驗證（本機開發用）。
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const force = new URL(request.url).searchParams.get("force") === "1";
  const result = await scanWatches({ force, store: supabaseAdminStore });
  return NextResponse.json({ ...result, at: new Date().toISOString() });
}
