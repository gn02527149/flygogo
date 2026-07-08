import { randomUUID } from "crypto";
import type {
  DestinationGroup,
  PriceAlert,
  PriceSnapshot,
  RadarWatch,
} from "@/lib/types";
import { buildMockOptions, mockBasePrice } from "@/lib/flights/mock";
import type {
  CreateAlertInput,
  CreateGroupInput,
  CreateSnapshotInput,
  CreateWatchInput,
  Store,
} from "./types";

// In-memory demo store, used whenever Supabase env vars are absent. Data lives
// on globalThis so it survives Next.js dev-server HMR reloads. It resets when
// the server process restarts — fine for a demo, replaced by Supabase in prod.

type Db = {
  groups: DestinationGroup[];
  watches: RadarWatch[];
  snapshots: PriceSnapshot[];
  alerts: PriceAlert[];
};

const g = globalThis as unknown as { __flygogoDb?: Db };

function iso(daysAgo: number, hour = 12): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function futureDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function watchToQueryLegs(watch: RadarWatch) {
  if (watch.trip_type === "multi_city" && watch.segments) {
    return watch.segments.map((s) => ({
      origin: s.origin,
      destination: s.destination,
      depart_date: s.depart_date,
    }));
  }
  const legs = [
    {
      origin: watch.origin,
      destination: watch.destination ?? "",
      depart_date: watch.depart_date,
    },
  ];
  if (watch.trip_type === "round_trip") {
    legs.push({
      origin: watch.destination ?? "",
      destination: watch.origin,
      depart_date: watch.return_date,
    });
  }
  return legs;
}

function seed(): Db {
  const groups: DestinationGroup[] = [
    {
      id: randomUUID(),
      name: "東京雙機場",
      description: "成田 + 羽田",
      airport_codes: ["NRT", "HND"],
      created_at: iso(20),
    },
    {
      id: randomUUID(),
      name: "東南亞度假",
      description: "曼谷、新加坡、峴港",
      airport_codes: ["BKK", "SIN", "DAD"],
      created_at: iso(18),
    },
  ];

  const watches: RadarWatch[] = [
    {
      id: randomUUID(),
      name: "台北 → 東京 單程",
      destination_group_id: groups[0].id,
      trip_type: "one_way",
      origin: "TPE",
      destination: "NRT",
      depart_date: futureDate(30),
      return_date: null,
      segments: null,
      frequency_minutes: 60,
      scan_hour: null,
      max_price: null,
      status: "active",
      last_scanned_at: null,
      created_at: iso(15),
    },
    {
      id: randomUUID(),
      name: "台北 ⇄ 曼谷 來回",
      destination_group_id: groups[1].id,
      trip_type: "round_trip",
      origin: "TPE",
      destination: "BKK",
      depart_date: futureDate(45),
      return_date: futureDate(52),
      segments: null,
      frequency_minutes: 360,
      scan_hour: null,
      max_price: 9000,
      status: "active",
      last_scanned_at: null,
      created_at: iso(12),
    },
    {
      id: randomUUID(),
      name: "外站票：東京進大阪出",
      destination_group_id: null,
      trip_type: "multi_city",
      origin: "TPE",
      destination: null,
      depart_date: null,
      return_date: null,
      segments: [
        { origin: "TPE", destination: "NRT", depart_date: futureDate(60) },
        { origin: "HND", destination: "CTS", depart_date: futureDate(63) },
        { origin: "CTS", destination: "KIX", depart_date: futureDate(66) },
        { origin: "KIX", destination: "TPE", depart_date: futureDate(70) },
      ],
      frequency_minutes: 720,
      scan_hour: null,
      max_price: null,
      status: "active",
      last_scanned_at: null,
      created_at: iso(8),
    },
  ];

  // Seed ~6 snapshots per watch across the current month so the
  // monthly-average baseline exists from the first real scan.
  const snapshots: PriceSnapshot[] = [];
  for (const watch of watches) {
    const query = {
      trip_type: watch.trip_type,
      legs: watchToQueryLegs(watch),
    };
    const base = mockBasePrice(query);
    for (let i = 6; i >= 1; i--) {
      const drift = Math.sin(i * 1.7) * 0.1 + (i % 3) * 0.04;
      const options = buildMockOptions(query, Math.round(base * (1 + drift)));
      snapshots.push({
        id: randomUUID(),
        watch_id: watch.id,
        price: options[0].price,
        currency: "TWD",
        options,
        seen_at: iso(i * 2, 9 + i),
      });
    }
  }

  return { groups, watches, snapshots, alerts: [] };
}

function db(): Db {
  if (!g.__flygogoDb) {
    g.__flygogoDb = seed();
  }
  return g.__flygogoDb;
}

export const memoryStore: Store = {
  async listGroups() {
    return [...db().groups];
  },

  async createGroup(input: CreateGroupInput) {
    const group: DestinationGroup = {
      id: randomUUID(),
      created_at: new Date().toISOString(),
      ...input,
    };
    db().groups.unshift(group);
    return group;
  },

  async deleteGroup(id: string) {
    const data = db();
    data.groups = data.groups.filter((g) => g.id !== id);
    for (const watch of data.watches) {
      if (watch.destination_group_id === id) {
        watch.destination_group_id = null;
      }
    }
  },

  async listWatches() {
    return [...db().watches].sort((a, b) =>
      b.created_at.localeCompare(a.created_at)
    );
  },

  async createWatch(input: CreateWatchInput) {
    const watch: RadarWatch = {
      id: randomUUID(),
      destination_group_id: null,
      status: "active",
      last_scanned_at: null,
      created_at: new Date().toISOString(),
      ...input,
    };
    db().watches.unshift(watch);
    return watch;
  },

  async updateWatch(id: string, patch: Partial<RadarWatch>) {
    const watch = db().watches.find((w) => w.id === id);
    if (watch) {
      Object.assign(watch, patch);
    }
  },

  async deleteWatch(id: string) {
    const data = db();
    data.watches = data.watches.filter((w) => w.id !== id);
    data.snapshots = data.snapshots.filter((s) => s.watch_id !== id);
    data.alerts = data.alerts.filter((a) => a.watch_id !== id);
  },

  async listSnapshots(watchId?: string) {
    return db()
      .snapshots.filter((s) => !watchId || s.watch_id === watchId)
      .sort((a, b) => b.seen_at.localeCompare(a.seen_at));
  },

  async addSnapshot(input: CreateSnapshotInput) {
    db().snapshots.push({
      id: randomUUID(),
      seen_at: new Date().toISOString(),
      ...input,
    });
  },

  async listAlerts(unreadOnly = false) {
    return db()
      .alerts.filter((a) => !unreadOnly || !a.read)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  async createAlert(input: CreateAlertInput) {
    db().alerts.unshift({
      id: randomUUID(),
      read: false,
      created_at: new Date().toISOString(),
      ...input,
    });
  },

  async markAlertsRead(ids: string[]) {
    const set = new Set(ids);
    for (const alert of db().alerts) {
      if (set.has(alert.id)) {
        alert.read = true;
      }
    }
  },
};
