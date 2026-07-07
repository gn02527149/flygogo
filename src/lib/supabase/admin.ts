import { createClient } from "@supabase/supabase-js";

/**
 * Admin 客戶端（service_role）。只能在伺服器端使用，用於：
 * 建立帳號（跳過 email 驗證與寄信）。金鑰絕不可暴露到瀏覽器。
 */
export function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
