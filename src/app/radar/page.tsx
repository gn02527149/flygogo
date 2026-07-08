import Link from "next/link";
import { Card, ConfigBanner, EmptyState, PageHeader } from "@/components/ui";
import { WatchTable, type WatchRow } from "@/components/WatchTable";
import { SubmitButton } from "@/components/SubmitButton";
import { getStore } from "@/lib/store";
import { monthlyAverage } from "@/lib/scan";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import type { PriceSnapshot } from "@/lib/types";
import { scanNowAction } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function RadarPage() {
  const store = getStore();
  const [watches, snapshots, groups] = await Promise.all([
    store.listWatches(),
    store.listSnapshots(),
    store.listGroups(),
  ]);
  const groupName = new Map(groups.map((g) => [g.id, g.name]));

  const byWatch = new Map<string, PriceSnapshot[]>();
  for (const snap of snapshots) {
    const list = byWatch.get(snap.watch_id) ?? [];
    list.push(snap);
    byWatch.set(snap.watch_id, list);
  }

  const rows: WatchRow[] = watches.map((watch) => {
    const snaps = byWatch.get(watch.id) ?? [];
    return {
      watch,
      latest: snaps[0] ?? null,
      baseline: monthlyAverage(snaps),
      history: snaps.slice(0, 12),
      groupName: watch.destination_group_id
        ? (groupName.get(watch.destination_group_id) ?? null)
        : null,
    };
  });

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between md:mb-6">
        <PageHeader title="雷達" description="航段價格清單，點擊航段可查看航班明細" />
        <div className="-mt-2 flex gap-2 sm:mt-0">
          <form action={scanNowAction} className="flex-1 sm:flex-none">
            <SubmitButton
              pendingText="掃描中…"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-slate-400"
            >
              ⚡ 立即掃描
            </SubmitButton>
          </form>
          <Link
            href="/radar/new"
            className="flex-1 rounded-lg bg-slate-900 px-4 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-slate-700 sm:flex-none"
          >
            ＋ 新增航段
          </Link>
        </div>
      </div>

      {!isSupabaseConfigured() ? <ConfigBanner /> : null}

      {rows.length === 0 ? (
        <Card title="航段清單">
          <EmptyState message="尚無航段。點「＋ 新增航段」建立第一個。" />
        </Card>
      ) : (
        <WatchTable rows={rows} />
      )}
    </div>
  );
}
