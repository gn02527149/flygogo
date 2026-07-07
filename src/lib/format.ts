import type { FlightOption } from "@/lib/types";

/** e.g. "手提10kg・無托運" / "手提7kg・托運23kg" / "行李另計" */
export function baggageLabel(option: FlightOption): string {
  if (option.carry_on_kg == null && option.checked_kg == null) {
    return "行李另計";
  }
  const parts: string[] = [];
  if (option.carry_on_kg != null) parts.push(`手提${option.carry_on_kg}kg`);
  parts.push(
    option.checked_kg != null ? `托運${option.checked_kg}kg` : "無托運"
  );
  return parts.join("・");
}

/** e.g. "08/06 07:45 → 11:50"（同日只顯示一次日期；跨日保留完整日期）。 */
export function timeRange(option: FlightOption): string {
  const depart = option.depart_time;
  const arrive = option.arrive_time;
  if (!depart && !arrive) return "";
  const departDate = depart.split(" ")[0];
  const arriveParts = arrive.split(" ");
  const arriveDisplay =
    arriveParts.length === 2 && arriveParts[0] === departDate
      ? arriveParts[1]
      : arrive;
  return `${depart} → ${arriveDisplay}`;
}

/** e.g. "3 小時 10 分" */
export function durationLabel(minutes: number | null): string {
  if (minutes == null) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} 分`;
  return m === 0 ? `${h} 小時` : `${h} 小時 ${m} 分`;
}
