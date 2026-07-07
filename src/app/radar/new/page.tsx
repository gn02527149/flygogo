import Link from "next/link";
import { Card, PageHeader } from "@/components/ui";
import { WatchForm } from "@/components/WatchForm";
import { createWatchAction } from "@/app/actions";

export const dynamic = "force-dynamic";

const ERROR_MESSAGES: Record<string, string> = {
  segments: "外站票至少需要 4 個完整航段（出發與抵達機場都要填）。",
  route: "請填寫出發與抵達機場代碼。",
};

export default async function NewWatchPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const errorMessage = error ? ERROR_MESSAGES[error] : null;

  return (
    <div className="max-w-2xl">
      <div className="mb-2">
        <Link
          href="/radar"
          className="text-sm text-slate-400 transition-colors hover:text-slate-600"
        >
          ← 回雷達
        </Link>
      </div>
      <PageHeader
        title="新增守望"
        description="選擇航線與偵測頻率，價格低於當月平均時會即時警示"
      />

      {errorMessage ? (
        <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <Card>
        <WatchForm action={createWatchAction} />
      </Card>
    </div>
  );
}
