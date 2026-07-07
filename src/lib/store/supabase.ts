import { getSupabaseServerClient } from "@/lib/supabase/server";
import type {
  DestinationGroup,
  PriceAlert,
  PriceSnapshot,
  RadarWatch,
} from "@/lib/types";
import type {
  CreateAlertInput,
  CreateSnapshotInput,
  CreateWatchInput,
  Store,
} from "./types";

// Supabase-backed store. Every method degrades to a safe no-op / empty result
// on connection errors so a bad network never crashes a page render.

async function client() {
  return getSupabaseServerClient();
}

function logError(op: string, err: unknown) {
  console.error(`[store] ${op}:`, err instanceof Error ? err.message : err);
}

export const supabaseStore: Store = {
  async listGroups() {
    const supabase = await client();
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from("destination_groups")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DestinationGroup[];
    } catch (err) {
      logError("listGroups", err);
      return [];
    }
  },

  async listWatches() {
    const supabase = await client();
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from("radar_watches")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as RadarWatch[];
    } catch (err) {
      logError("listWatches", err);
      return [];
    }
  },

  async createWatch(input: CreateWatchInput) {
    const supabase = await client();
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from("radar_watches")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as RadarWatch;
    } catch (err) {
      logError("createWatch", err);
      return null;
    }
  },

  async updateWatch(id: string, patch: Partial<RadarWatch>) {
    const supabase = await client();
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from("radar_watches")
        .update(patch)
        .eq("id", id);
      if (error) throw error;
    } catch (err) {
      logError("updateWatch", err);
    }
  },

  async deleteWatch(id: string) {
    const supabase = await client();
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from("radar_watches")
        .delete()
        .eq("id", id);
      if (error) throw error;
    } catch (err) {
      logError("deleteWatch", err);
    }
  },

  async listSnapshots(watchId?: string) {
    const supabase = await client();
    if (!supabase) return [];
    try {
      let query = supabase
        .from("price_snapshots")
        .select("*")
        .order("seen_at", { ascending: false });
      if (watchId) {
        query = query.eq("watch_id", watchId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as PriceSnapshot[];
    } catch (err) {
      logError("listSnapshots", err);
      return [];
    }
  },

  async addSnapshot(input: CreateSnapshotInput) {
    const supabase = await client();
    if (!supabase) return;
    try {
      const { error } = await supabase.from("price_snapshots").insert(input);
      if (error) throw error;
    } catch (err) {
      logError("addSnapshot", err);
    }
  },

  async listAlerts(unreadOnly = false) {
    const supabase = await client();
    if (!supabase) return [];
    try {
      let query = supabase
        .from("price_alerts")
        .select("*")
        .order("created_at", { ascending: false });
      if (unreadOnly) {
        query = query.eq("read", false);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as PriceAlert[];
    } catch (err) {
      logError("listAlerts", err);
      return [];
    }
  },

  async createAlert(input: CreateAlertInput) {
    const supabase = await client();
    if (!supabase) return;
    try {
      const { error } = await supabase.from("price_alerts").insert(input);
      if (error) throw error;
    } catch (err) {
      logError("createAlert", err);
    }
  },

  async markAlertsRead(ids: string[]) {
    const supabase = await client();
    if (!supabase || ids.length === 0) return;
    try {
      const { error } = await supabase
        .from("price_alerts")
        .update({ read: true })
        .in("id", ids);
      if (error) throw error;
    } catch (err) {
      logError("markAlertsRead", err);
    }
  },
};
