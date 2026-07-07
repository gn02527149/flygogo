import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-5 md:mb-6">
      <h1 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
        {title}
      </h1>
      {description ? (
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      ) : null}
    </div>
  );
}

export function Card({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
      {title ? (
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
          {title}
        </h2>
      ) : null}
      {children}
    </section>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
      <div className="text-xs font-medium text-slate-500 md:text-sm">
        {label}
      </div>
      <div className="mt-1.5 text-2xl font-bold text-slate-900 md:mt-2 md:text-3xl">
        {value}
      </div>
      {hint ? <div className="mt-1 text-xs text-slate-400">{hint}</div> : null}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

export function ConfigBanner() {
  return (
    <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      目前使用<strong>內建示範資料</strong>（未連接 Supabase，重啟後重置）。要保存資料請在{" "}
      <code className="font-mono">.env.local</code> 填入 Supabase 金鑰並執行{" "}
      <code className="font-mono">supabase/schema.sql</code>。
    </div>
  );
}
