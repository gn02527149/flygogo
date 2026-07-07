"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/app/actions";

const links = [
  { href: "/", label: "總覽", icon: "📊" },
  { href: "/radar", label: "雷達", icon: "📡" },
  { href: "/groups", label: "目的地群組", shortLabel: "群組", icon: "🗂️" },
];

function isActive(href: string, pathname: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Sidebar({ userName }: { userName?: string | null }) {
  const pathname = usePathname();

  // 登入頁不顯示導覽。
  if (pathname === "/login") return null;

  return (
    <>
      {/* 桌機：左側欄 */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-6 md:flex">
        <div className="px-2 pb-6 text-xl font-bold tracking-tight text-slate-900">
          ✈️ flygogo
        </div>
        <nav className="flex flex-col gap-1">
          {links.map((link) => {
            const active = isActive(link.href, pathname);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {userName ? (
          <div className="mt-auto border-t border-slate-100 px-2 pt-4">
            <div className="mb-2 truncate text-xs text-slate-500">
              👤 {userName}
            </div>
            <form action={signOutAction}>
              <button
                type="submit"
                className="w-full rounded-md border border-slate-200 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-700"
              >
                登出
              </button>
            </form>
          </div>
        ) : null}
      </aside>

      {/* 手機：頂部品牌列 */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur md:hidden">
        <span className="text-lg font-bold tracking-tight text-slate-900">
          ✈️ flygogo
        </span>
        {userName ? (
          <form action={signOutAction} className="flex items-center gap-2">
            <span className="max-w-24 truncate text-xs text-slate-500">
              👤 {userName}
            </span>
            <button
              type="submit"
              className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-500"
            >
              登出
            </button>
          </form>
        ) : null}
      </header>

      {/* 手機：底部分頁列 */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="主導覽"
      >
        {links.map((link) => {
          const active = isActive(link.href, pathname);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors ${
                active ? "text-slate-900" : "text-slate-400"
              }`}
            >
              <span className="text-lg leading-none" aria-hidden>
                {link.icon}
              </span>
              {link.shortLabel ?? link.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
