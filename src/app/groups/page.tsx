import { Card, ConfigBanner, EmptyState, PageHeader } from "@/components/ui";
import { getStore } from "@/lib/store";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function GroupsPage() {
  const groups = await getStore().listGroups();

  return (
    <div>
      <PageHeader title="目的地群組" description="用機場代碼分群，之後可讓一個航段同時盯多個目的地" />

      {!isSupabaseConfigured() ? <ConfigBanner /> : null}

      {groups.length === 0 ? (
        <Card>
          <EmptyState message="尚無目的地群組。串接 Supabase 後即可在此分群管理機場代碼。" />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <Card key={g.id} title={g.name}>
              {g.description ? (
                <p className="mb-3 text-sm text-slate-500">{g.description}</p>
              ) : null}
              <div className="flex flex-wrap gap-1.5">
                {g.airport_codes.length === 0 ? (
                  <span className="text-xs text-slate-400">尚無機場代碼</span>
                ) : (
                  g.airport_codes.map((code) => (
                    <span
                      key={code}
                      className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600"
                    >
                      {code}
                    </span>
                  ))
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
