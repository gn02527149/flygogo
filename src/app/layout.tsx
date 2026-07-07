import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { AlertToaster } from "@/components/AlertToaster";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "flygogo 機票雷達",
  description: "機票雷達 — 目的地分群與價格守望",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await getSupabaseServerClient();
  let userName: string | null = null;
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    // 帳號存為「帳號@user.flygogo.app」，顯示時取回帳號部分。
    userName = user?.email?.split("@")[0] ?? null;
  }

  return (
    <html lang="zh-Hant">
      <body className="antialiased">
        <div className="flex min-h-screen flex-col md:flex-row">
          <Sidebar userName={userName} />
          {/* 手機底部留空給分頁列 */}
          <main className="flex-1 px-4 pb-24 pt-6 md:px-8 md:py-8">
            {children}
          </main>
        </div>
        <AlertToaster />
      </body>
    </html>
  );
}
