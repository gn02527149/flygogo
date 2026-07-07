# flygogo

機票雷達骨架 — Next.js (App Router) + TypeScript + Tailwind + Supabase。

本階段範圍：`destination_groups`、`radar_watches`、`radar_targets` 三張表，以及
Dashboard / Radar / Groups 三個頁面。**尚未**串接 Amadeus、LINE、外站票。

## 啟動

```bash
npm install
cp .env.local.example .env.local   # 填入 Supabase 金鑰（可選，未填也能跑）
npm run dev                        # http://localhost:3000
```

## Supabase

在 Supabase SQL editor 執行 [`supabase/schema.sql`](supabase/schema.sql) 建立資料表。

未設定環境變數時，頁面會顯示「尚未連接 Supabase」橫幅並以空資料呈現，方便先檢視 UI。

## 指令

| 指令 | 說明 |
| --- | --- |
| `npm run dev` | 開發伺服器 |
| `npm run build` | production 編譯 |
| `npm run start` | 啟動 production server |
| `npm run lint` | ESLint 檢查 |
