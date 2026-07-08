import { Card, ConfigBanner, EmptyState, PageHeader } from "@/components/ui";
import { GroupForm } from "@/components/GroupForm";
import { airportLabel } from "@/lib/airports";
import { getStore } from "@/lib/store";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { deleteGroupAction } from "@/app/actions";

export const dynamic = "force-dynamic";

const ERROR_MESSAGES: Record<string, string> = {
  invalid: "群組需要名稱和至少 1 個機場。",
  "in-use": "還有航段綁著這個群組，請先刪除或改綁那些航段。",
};

export default async function GroupsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ error }, groups] = await Promise.all([
    searchParams,
    getStore().listGroups(),
  ]);
  const errorMessage = error ? ERROR_MESSAGES[error] : null;

  return (
    <div>
      <PageHeader
        title="目的地群組"
        description="把多個機場分成一組，一個航段就能同時監控整組目的地、回報最便宜的"
      />

      {!isSupabaseConfigured() ? <ConfigBanner /> : null}

      {errorMessage ? (
        <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="建立群組">
          <GroupForm />
          <p className="mt-3 text-xs text-slate-400">
            💡 群組內每個機場掃描時各算 1 次額度：2 個機場的群組每天用 2 次。
          </p>
        </Card>

        <Card title="我的群組">
          {groups.length === 0 ? (
            <EmptyState message="尚無群組。左邊建立第一個，例如「東京雙機場」＝成田＋羽田。" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {groups.map((group) => (
                <li key={group.id} className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium text-slate-800">
                        {group.name}
                      </div>
                      {group.description ? (
                        <div className="mt-0.5 text-xs text-slate-400">
                          {group.description}
                        </div>
                      ) : null}
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {group.airport_codes.map((code) => (
                          <span
                            key={code}
                            className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                          >
                            {airportLabel(code)}
                          </span>
                        ))}
                      </div>
                    </div>
                    <form action={deleteGroupAction.bind(null, group.id)}>
                      <button
                        type="submit"
                        className="shrink-0 rounded-md border border-rose-200 px-2 py-1 text-xs text-rose-500 transition-colors hover:border-rose-300 hover:bg-rose-50"
                      >
                        刪除
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
