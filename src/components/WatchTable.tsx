"use client";

import { useEffect, useState } from "react";
import { deleteWatchAction, toggleWatchAction } from "@/app/actions";
import { airportLabel } from "@/lib/airports";
import { baggageLabel, timeRange } from "@/lib/format";
import type { PriceSnapshot, RadarWatch } from "@/lib/types";

export type WatchRow = {
  watch: RadarWatch;
  latest: PriceSnapshot | null;
  baseline: { average: number; samples: number } | null;
  // 最近的掃描紀錄（新到舊），供彈窗的價格走勢使用。
  history: PriceSnapshot[];
};

const TRIP_LABEL: Record<string, string> = {
  one_way: "單程",
  round_trip: "來回",
  multi_city: "外站票",
};

function frequencyLabel(minutes: number): string {
  if (minutes < 60) return `每 ${minutes} 分鐘`;
  if (minutes < 1440) return `每 ${minutes / 60} 小時`;
  return `每 ${minutes / 1440} 天`;
}

function routeSummary(watch: RadarWatch): string {
  if (watch.trip_type === "multi_city" && watch.segments?.length) {
    const stops = [
      ...watch.segments.map((s) => s.origin),
      watch.segments[watch.segments.length - 1].destination,
    ];
    return `${stops.join("→")}（${watch.segments.length} 段）`;
  }
  const arrow = watch.trip_type === "round_trip" ? "⇄" : "→";
  return `${watch.origin} ${arrow} ${watch.destination ?? "?"}`;
}

function zhRoute(watch: RadarWatch): string {
  if (watch.trip_type === "multi_city" && watch.segments?.length) {
    return `${airportLabel(watch.segments[0].origin)} 出發，共 ${watch.segments.length} 段`;
  }
  const arrow = watch.trip_type === "round_trip" ? "⇄" : "→";
  return `${airportLabel(watch.origin)} ${arrow} ${airportLabel(watch.destination ?? "")}`;
}

function isBelowAvg(row: WatchRow): boolean {
  return Boolean(
    row.latest && row.baseline && row.latest.price < row.baseline.average
  );
}

function StatusBadge({ status }: { status: string }) {
  const active = status === "active";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
        active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
      }`}
    >
      {active ? "啟用中" : "已暫停"}
    </span>
  );
}

function WatchActions({
  watch,
  size = "sm",
  onDelete,
}: {
  watch: RadarWatch;
  size?: "sm" | "md";
  onDelete?: () => void;
}) {
  const btn =
    size === "md"
      ? "flex-1 rounded-lg px-3 py-2 text-sm"
      : "rounded-md px-2 py-1 text-xs";
  return (
    <div
      className={`flex gap-1.5 ${size === "md" ? "w-full" : ""}`}
      onClick={(e) => e.stopPropagation()}
    >
      <form
        action={toggleWatchAction.bind(null, watch.id, watch.status)}
        className={size === "md" ? "flex-1" : ""}
      >
        <button
          type="submit"
          className={`${btn} w-full border border-slate-200 text-center font-medium text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-700`}
        >
          {watch.status === "active" ? "暫停" : "啟用"}
        </button>
      </form>
      <form
        action={deleteWatchAction.bind(null, watch.id)}
        onSubmit={onDelete}
        className={size === "md" ? "flex-1" : ""}
      >
        <button
          type="submit"
          className={`${btn} w-full border border-rose-200 text-center font-medium text-rose-500 transition-colors hover:border-rose-300 hover:bg-rose-50`}
        >
          刪除
        </button>
      </form>
    </div>
  );
}

/** 簡易價格走勢圖（舊到新）。 */
function Sparkline({ prices, alert }: { prices: number[]; alert: boolean }) {
  if (prices.length < 2) return null;
  const w = 280;
  const h = 48;
  const pad = 5;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const span = max - min || 1;
  const points = prices.map((p, i) => ({
    x: pad + (i * (w - 2 * pad)) / (prices.length - 1),
    y: pad + (1 - (p - min) / span) * (h - 2 * pad),
  }));
  const last = points[points.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-12 w-full" aria-hidden>
      <polyline
        fill="none"
        stroke="#94a3b8"
        strokeWidth="1.5"
        points={points.map((p) => `${p.x},${p.y}`).join(" ")}
      />
      <circle
        cx={last.x}
        cy={last.y}
        r="3"
        fill={alert ? "#e11d48" : "#0f172a"}
      />
    </svg>
  );
}

function DetailModal({ row, onClose }: { row: WatchRow; onClose: () => void }) {
  const { watch, latest, baseline, history } = row;
  const belowAvg = isBelowAvg(row);
  // history 是新到舊；走勢圖要舊到新。
  const trend = [...history].reverse().map((s) => s.price);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${watch.name} 明細`}
    >
      <div
        className="max-h-[88vh] w-full overflow-auto rounded-t-2xl bg-white p-5 shadow-xl sm:max-w-lg sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 標題 */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">{watch.name}</h2>
              <StatusBadge status={watch.status} />
            </div>
            <div className="mt-1 text-sm text-slate-500">{zhRoute(watch)}</div>
            <div className="font-mono text-xs text-slate-400">
              {routeSummary(watch)}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="關閉"
          >
            ✕
          </button>
        </div>

        {/* 外站票航段 */}
        {watch.trip_type === "multi_city" && watch.segments?.length ? (
          <div className="mt-4 space-y-1 rounded-lg bg-slate-50 p-3">
            {watch.segments.map((seg, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                <span className="w-4 text-center font-semibold text-slate-400">
                  {i + 1}
                </span>
                {airportLabel(seg.origin)} → {airportLabel(seg.destination)}
                {seg.depart_date ? (
                  <span className="ml-auto text-slate-400">{seg.depart_date}</span>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        {/* 數據 */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-slate-50 p-3">
            <div className="text-xs text-slate-400">最新價格</div>
            <div
              className={`mt-0.5 text-xl font-bold ${belowAvg ? "text-rose-600" : "text-slate-900"}`}
            >
              {latest ? `${latest.price.toLocaleString()}` : "—"}
              {belowAvg ? " 🔻" : ""}
            </div>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <div className="text-xs text-slate-400">當月均價</div>
            <div className="mt-0.5 text-xl font-bold text-slate-900">
              {baseline ? baseline.average.toLocaleString() : "—"}
            </div>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <div className="text-xs text-slate-400">偵測頻率</div>
            <div className="mt-0.5 text-sm font-semibold text-slate-700">
              {frequencyLabel(watch.frequency_minutes)}
            </div>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <div className="text-xs text-slate-400">價格門檻</div>
            <div className="mt-0.5 text-sm font-semibold text-slate-700">
              {watch.max_price ? `TWD ${watch.max_price.toLocaleString()}` : "未設定"}
            </div>
          </div>
        </div>

        {/* 價格走勢 */}
        {trend.length >= 2 ? (
          <div className="mt-4">
            <div className="mb-1 text-xs font-medium text-slate-500">
              價格走勢（近 {trend.length} 次掃描）
            </div>
            <Sparkline prices={trend} alert={belowAvg} />
          </div>
        ) : null}

        {/* 最新航班報價 */}
        <div className="mt-4">
          <div className="mb-2 text-xs font-medium text-slate-500">
            最新掃描航班
          </div>
          {latest?.options?.length ? (
            <ul className="space-y-1.5">
              {latest.options.map((option, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-bold text-slate-400 ring-1 ring-slate-200">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-medium text-slate-700">
                      {option.airline}
                      <span className="ml-1.5 font-mono text-slate-400">
                        {option.flight_number}
                      </span>
                    </div>
                    <div className="mt-0.5 truncate text-xs text-slate-400">
                      {timeRange(option)}・{baggageLabel(option)}
                    </div>
                  </div>
                  <span className="shrink-0 whitespace-nowrap text-sm font-semibold text-slate-900">
                    {option.price.toLocaleString()}
                    <span className="ml-0.5 text-[10px] font-normal text-slate-400">
                      TWD
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-lg bg-slate-50 px-3 py-4 text-center text-xs text-slate-400">
              尚無掃描資料，回清單按「⚡ 立即掃描」
            </div>
          )}
        </div>

        {/* 掃描紀錄 */}
        {history.length > 0 ? (
          <div className="mt-4">
            <div className="mb-2 text-xs font-medium text-slate-500">掃描紀錄</div>
            <ul className="divide-y divide-slate-100 rounded-lg border border-slate-100">
              {history.slice(0, 6).map((snap) => (
                <li
                  key={snap.id}
                  className="flex items-center justify-between px-3 py-2 text-xs"
                >
                  <span className="text-slate-500">
                    {new Date(snap.seen_at).toLocaleString("zh-TW", {
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })}
                  </span>
                  <span className="font-semibold text-slate-800">
                    TWD {snap.price.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* 操作 */}
        <div className="mt-5 border-t border-slate-100 pt-4">
          <WatchActions watch={watch} size="md" onDelete={onClose} />
        </div>
      </div>
    </div>
  );
}

export function WatchTable({ rows }: { rows: WatchRow[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const openRow = rows.find((r) => r.watch.id === openId) ?? null;

  return (
    <>
      {/* 手機：卡片清單 */}
      <div className="flex flex-col gap-3 md:hidden">
        {rows.map((row) => {
          const { watch, latest, baseline } = row;
          const belowAvg = isBelowAvg(row);
          return (
            <button
              key={watch.id}
              type="button"
              onClick={() => setOpenId(watch.id)}
              className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-colors active:bg-slate-50"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-medium text-slate-800">{watch.name}</div>
                  <div className="mt-0.5 font-mono text-xs text-slate-400">
                    {routeSummary(watch)}
                  </div>
                </div>
                <StatusBadge status={watch.status} />
              </div>

              <div className="mt-3 flex items-end justify-between">
                <div>
                  <div className="text-xs text-slate-400">最新價格</div>
                  {latest ? (
                    <div
                      className={`text-lg font-bold ${belowAvg ? "text-rose-600" : "text-slate-900"}`}
                    >
                      TWD {latest.price.toLocaleString()}
                      {belowAvg ? " 🔻" : ""}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-400">尚未掃描</div>
                  )}
                </div>
                <div className="text-right text-xs text-slate-500">
                  <div>
                    {TRIP_LABEL[watch.trip_type] ?? watch.trip_type}・
                    {frequencyLabel(watch.frequency_minutes)}
                  </div>
                  <div className="mt-0.5">
                    當月均價{" "}
                    {baseline ? `TWD ${baseline.average.toLocaleString()}` : "—"}
                  </div>
                </div>
              </div>

              <div className="mt-3 text-center text-xs text-slate-400">
                點擊查看航班明細 ›
              </div>
            </button>
          );
        })}
      </div>

      {/* 桌機：表格 */}
      <div className="hidden md:block">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            守望清單
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                  <th className="py-2 pr-4 font-medium">守望</th>
                  <th className="py-2 pr-4 font-medium">類型</th>
                  <th className="py-2 pr-4 font-medium">頻率</th>
                  <th className="py-2 pr-4 font-medium">最新價格</th>
                  <th className="py-2 pr-4 font-medium">當月均價</th>
                  <th className="py-2 pr-4 font-medium">狀態</th>
                  <th className="py-2 font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => {
                  const { watch, latest, baseline } = row;
                  const belowAvg = isBelowAvg(row);
                  return (
                    <tr
                      key={watch.id}
                      onClick={() => setOpenId(watch.id)}
                      className="cursor-pointer transition-colors hover:bg-slate-50"
                    >
                      <td className="py-3 pr-4">
                        <div className="font-medium text-slate-800">
                          {watch.name}
                        </div>
                        <div className="font-mono text-xs text-slate-400">
                          {routeSummary(watch)}
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-slate-600">
                        {TRIP_LABEL[watch.trip_type] ?? watch.trip_type}
                      </td>
                      <td className="py-3 pr-4 text-slate-600">
                        {frequencyLabel(watch.frequency_minutes)}
                      </td>
                      <td className="py-3 pr-4">
                        {latest ? (
                          <>
                            <span
                              className={
                                belowAvg
                                  ? "font-semibold text-rose-600"
                                  : "text-slate-800"
                              }
                            >
                              TWD {latest.price.toLocaleString()}
                              {belowAvg ? " 🔻" : ""}
                            </span>
                            {latest.options?.[0] ? (
                              <div className="mt-0.5 text-xs text-slate-400">
                                {latest.options[0].airline}{" "}
                                {latest.options[0].flight_number}・
                                {timeRange(latest.options[0])}
                              </div>
                            ) : null}
                          </>
                        ) : (
                          <span className="text-slate-400">尚未掃描</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-slate-600">
                        {baseline ? `TWD ${baseline.average.toLocaleString()}` : "—"}
                      </td>
                      <td className="py-3 pr-4">
                        <StatusBadge status={watch.status} />
                      </td>
                      <td className="py-3">
                        <WatchActions watch={watch} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {openRow ? (
        <DetailModal row={openRow} onClose={() => setOpenId(null)} />
      ) : null}
    </>
  );
}
