-- flygogo — 每日掃描時刻（在既有資料庫上執行一次）
-- radar_watches 加 scan_hour（0–23，台灣時間），每天模式在該時刻後掃描。

alter table public.radar_watches
  add column if not exists scan_hour smallint
  check (scan_hour between 0 and 23);

-- 既有的每天守望預設為早上 8 點。
update public.radar_watches
  set scan_hour = 8
  where frequency_minutes >= 1440 and scan_hour is null;
