"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { PriceAlert } from "@/lib/types";
import { baggageLabel, timeRange } from "@/lib/format";

const POLL_MS = 20_000;

// Top-right floating price alerts. Polls the scan tick (which only scans
// watches that are due per their frequency) and then pulls unread alerts.
export function AlertToaster() {
  const pathname = usePathname();
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const disabled = pathname === "/login";

  const refresh = useCallback(async () => {
    try {
      await fetch("/api/scan", { method: "POST" });
      const res = await fetch("/api/alerts?unread=1", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { alerts: PriceAlert[] };
      setAlerts(data.alerts.slice(0, 5));
    } catch {
      // Network hiccup — try again next poll.
    }
  }, []);

  useEffect(() => {
    if (disabled) return;
    refresh();
    const timer = setInterval(refresh, POLL_MS);
    return () => clearInterval(timer);
  }, [refresh, disabled]);

  const dismiss = async (id: string) => {
    setAlerts((current) => current.filter((a) => a.id !== id));
    try {
      await fetch("/api/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      });
    } catch {
      // Already removed locally; the server copy stays unread until next dismiss.
    }
  };

  if (alerts.length === 0) return null;

  return (
    <div className="fixed inset-x-4 top-16 z-50 flex flex-col gap-3 sm:inset-x-auto sm:right-4 sm:top-4 sm:w-80">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="toast-in rounded-xl border border-rose-200 bg-white p-4 shadow-lg"
          role="alert"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-rose-600">
                <span aria-hidden>🔻</span> 低價警示
              </div>
              <div className="mt-1 text-sm font-medium text-slate-800">
                {alert.watch_name}
              </div>
              <div className="mt-0.5 text-xs text-slate-500">
                {alert.message}
              </div>
            </div>
            <button
              onClick={() => dismiss(alert.id)}
              className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              aria-label="關閉警示"
            >
              ✕
            </button>
          </div>

          {/* 最低的三個航班 */}
          {alert.options?.length ? (
            <ul className="mt-3 space-y-1.5 border-t border-slate-100 pt-2.5">
              {alert.options.map((option, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-bold text-slate-400 ring-1 ring-slate-200">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-slate-700">
                      {option.airline}
                      <span className="ml-1 font-mono text-slate-400">
                        {option.flight_number}
                      </span>
                    </div>
                    <div className="mt-0.5 truncate text-slate-400">
                      {option.destination ? `→ ${option.destination}・` : ""}
                      {timeRange(option)}・{baggageLabel(option)}
                    </div>
                  </div>
                  <span className="shrink-0 whitespace-nowrap font-semibold text-slate-900">
                    {option.price.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ))}
    </div>
  );
}
