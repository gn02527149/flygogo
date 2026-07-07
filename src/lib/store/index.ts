import { isSupabaseConfigured } from "@/lib/supabase/server";
import { memoryStore } from "./memory";
import { supabaseStore } from "./supabase";
import type { Store } from "./types";

export type {
  CreateAlertInput,
  CreateSnapshotInput,
  CreateWatchInput,
  Store,
} from "./types";

/**
 * Returns the active store: Supabase when configured, otherwise the in-memory
 * demo store (seeded with sample watches so the UI is browsable immediately).
 */
export function getStore(): Store {
  return isSupabaseConfigured() ? supabaseStore : memoryStore;
}
