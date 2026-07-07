"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerAction } from "@/app/actions";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

// 帳號密碼登入/註冊。內部把帳號轉成虛擬 email（Supabase Auth 需要），
// 不寄驗證信；密碼由 Supabase 以 bcrypt 雜湊保存，後台看不到原文。

const EMAIL_DOMAIN = "user.flygogo.app";

const inputCls =
  "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none";

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      setError("帳號需為 3–20 個英數字或底線");
      return;
    }
    if (password.length < 6) {
      setError("密碼至少 6 個字元");
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("尚未設定 Supabase，目前為示範模式");
      return;
    }

    setBusy(true);
    const email = `${username.toLowerCase()}@${EMAIL_DOMAIN}`;

    try {
      if (mode === "register") {
        // 註冊走伺服器端 Admin API（不寄驗證信），成功後直接登入。
        const result = await registerAction(username, password);
        if (!result.ok) {
          setError(result.error ?? "註冊失敗");
          return;
        }
      }
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(
          error.message.includes("Invalid login credentials")
            ? "帳號或密碼錯誤"
            : error.message
        );
        return;
      }
      router.push("/");
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <div className="text-3xl font-bold tracking-tight text-slate-900">
          ✈️ flygogo
        </div>
        <p className="mt-1.5 text-sm text-slate-500">機票雷達 — 航段低價監控</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {/* 登入 / 註冊 切換 */}
        <div className="mb-5 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
          {(
            [
              { value: "login", label: "登入" },
              { value: "register", label: "註冊" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setMode(tab.value);
                setError(null);
              }}
              className={`rounded-md py-1.5 text-sm font-medium transition-colors ${
                mode === tab.value
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <div>
            <label
              className="mb-1 block text-xs font-medium text-slate-500"
              htmlFor="login-username"
            >
              帳號
            </label>
            <input
              id="login-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={inputCls}
              placeholder="英數字或底線，3–20 字"
              autoComplete="username"
              autoFocus
            />
          </div>
          <div>
            <label
              className="mb-1 block text-xs font-medium text-slate-500"
              htmlFor="login-password"
            >
              密碼
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
              placeholder="至少 6 個字元"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </div>

          {error ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-slate-900 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700 disabled:opacity-50"
          >
            {busy ? "處理中…" : mode === "login" ? "登入" : "建立帳號"}
          </button>
        </form>
      </div>

      <p className="mt-4 text-center text-xs text-slate-400">
        每位使用者的航段與警示互相獨立
      </p>
    </div>
  );
}
