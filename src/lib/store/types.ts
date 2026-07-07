import type {
  DestinationGroup,
  FlightOption,
  FlightSegment,
  PriceAlert,
  PriceSnapshot,
  RadarWatch,
  TripType,
} from "@/lib/types";

export type CreateWatchInput = {
  name: string;
  trip_type: TripType;
  origin: string;
  destination: string | null;
  depart_date: string | null;
  return_date: string | null;
  segments: FlightSegment[] | null;
  frequency_minutes: number;
  scan_hour: number | null;
  max_price: number | null;
};

export type CreateAlertInput = {
  watch_id: string;
  // cron（service role）寫入時必填；一般使用者 session 寫入可省略（DB default auth.uid()）。
  user_id?: string | null;
  watch_name: string;
  price: number;
  baseline: number | null;
  message: string;
  options: FlightOption[] | null;
};

export type CreateSnapshotInput = {
  watch_id: string;
  user_id?: string | null;
  price: number;
  currency: string;
  options: FlightOption[] | null;
};

// Storage abstraction: backed by Supabase when configured, otherwise by an
// in-memory demo store so the app is fully usable without credentials.
export interface Store {
  listGroups(): Promise<DestinationGroup[]>;

  listWatches(): Promise<RadarWatch[]>;
  createWatch(input: CreateWatchInput): Promise<RadarWatch | null>;
  updateWatch(id: string, patch: Partial<RadarWatch>): Promise<void>;
  deleteWatch(id: string): Promise<void>;

  listSnapshots(watchId?: string): Promise<PriceSnapshot[]>;
  addSnapshot(input: CreateSnapshotInput): Promise<void>;

  listAlerts(unreadOnly?: boolean): Promise<PriceAlert[]>;
  createAlert(input: CreateAlertInput): Promise<void>;
  markAlertsRead(ids: string[]): Promise<void>;
}
