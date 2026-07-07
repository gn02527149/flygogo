import Link from "next/link";
import { Card, ConfigBanner, EmptyState, PageHeader, StatCard } from "@/components/ui";
import { baggageLabel, timeRange } from "@/lib/format";
import { getStore } from "@/lib/store";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const store = getStore();
  const [groups, watches, snapshots, alerts] = await Promise.all([
    store.listGroups(),
    store.listWatches(),
    store.listSnapshots(),
    store.listAlerts(),
  ]);

  const activeWatches = watches.filter((w) => w.status === "active").length;
  const unreadAlerts = alerts.filter((a) => !a.read).length;
  const today = new Date().toDateString();
  const scansToday = snapshots.filter(
    (s) => new Date(s.seen_at).toDateString() === today
  ).length;
  const recentAlerts = alerts.slice(0, 5);
  const watchName = new Map(watches.map((w) => [w.id, w.name]));

  return (
    <div>
      <PageHeader title="總覽" description="機票雷達總覽" />

      {!isSupabaseConfigured() ? <ConfigBanner /> : null}

      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <StatCard
          label="雷達守望"
          value={watches.length}
          hint={`啟用中 ${activeWatches} 個`}
        />
        <StatCard label="未讀警示" value={unreadAlerts} hint="低價通知" />
        <StatCard label="今日掃描" value={scansToday} hint="報價快照次數" />
        <StatCard
          label="目的地群組"
          value={groups.length}
          hint="機場分群"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="最近低價警示">
          {recentAlerts.length === 0 ? (
            <EmptyState message="尚無警示。掃到低於當月平均的價格時會出現在這裡。" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentAlerts.map((alert) => (
                <li key={alert.id} className="py-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-800">
                      {alert.watch_name}
                    </span>
                    <span
                      className={`text-xs ${alert.read ? "text-slate-400" : "font-semibold text-rose-500"}`}
                    >
                      {alert.read ? "已讀" : "未讀"}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    {alert.message}
                  </div>
                  {alert.options?.length ? (
                    <ul className="mt-2 space-y-1.5">
                      {alert.options.map((option, i) => (
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
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="最近掃描">
          {snapshots.length === 0 ? (
            <EmptyState message="尚無掃描紀錄。到 Radar 頁按「⚡ 立即掃描」試試。" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {snapshots.slice(0, 5).map((snap) => {
                const cheapest = snap.options?.[0];
                const scannedAt = new Date(snap.seen_at).toLocaleTimeString(
                  "zh-TW",
                  { hour: "2-digit", minute: "2-digit", hour12: false }
                );
                return (
                  <li
                    key={snap.id}
                    className="flex items-center justify-between gap-3 py-3 text-sm"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium text-slate-800">
                        {watchName.get(snap.watch_id) ?? "（已刪除的守望）"}
                      </div>
                      <div className="mt-0.5 truncate text-xs text-slate-400">
                        {cheapest
                          ? `${cheapest.airline} ${cheapest.flight_number}・`
                          : ""}
                        {scannedAt} 掃描
                      </div>
                    </div>
                    <span className="shrink-0 whitespace-nowrap text-sm font-semibold text-slate-900">
                      {snap.price.toLocaleString()}
                      <span className="ml-0.5 text-[10px] font-normal text-slate-400">
                        TWD
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-6 text-sm">
        <Link href="/radar" className="text-slate-500 hover:text-slate-800">
          → 前往雷達管理守望
        </Link>
      </div>
    </div>
  );
}
