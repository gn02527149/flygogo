import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

type CookieToSet = { name: string; value: string; options: CookieOptions };

// Values shipped in .env.local.example. If the env still holds these, treat the
// project as unconfigured so we show the banner instead of fetching a dead host.
const PLACEHOLDERS = new Set([
  "https://your-project.supabase.co",
  "your-anon-key",
]);

function readSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey || PLACEHOLDERS.has(url) || PLACEHOLDERS.has(anonKey)) {
    return null;
  }
  return { url, anonKey };
}

/**
 * Returns a Supabase server client, or `null` if the project env vars are not
 * configured (missing or still the example placeholders). The skeleton stays
 * buildable and runnable without credentials — callers should handle the null
 * case by falling back to empty data.
 */
export async function getSupabaseServerClient() {
  const env = readSupabaseEnv();
  if (!env) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component — safe to ignore when middleware
          // is responsible for refreshing sessions.
        }
      },
    },
  });
}

export function isSupabaseConfigured() {
  return readSupabaseEnv() !== null;
}
