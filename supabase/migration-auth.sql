-- flygogo — auth 遷移（在既有資料庫上執行一次）
-- 為所有表加 user_id，並把「全開放」的開發 policy 換成「每人只能存取自己的資料」。

-- ----------------------------------------------------------------------------
-- 1. 加 user_id 欄位（預設自動填入當前登入者）
-- ----------------------------------------------------------------------------
alter table public.destination_groups
  add column if not exists user_id uuid default auth.uid() references auth.users (id) on delete cascade;
alter table public.radar_watches
  add column if not exists user_id uuid default auth.uid() references auth.users (id) on delete cascade;
alter table public.price_snapshots
  add column if not exists user_id uuid default auth.uid() references auth.users (id) on delete cascade;
alter table public.price_alerts
  add column if not exists user_id uuid default auth.uid() references auth.users (id) on delete cascade;
alter table public.radar_targets
  add column if not exists user_id uuid default auth.uid() references auth.users (id) on delete cascade;

-- ----------------------------------------------------------------------------
-- 2. 移除開發用的全開放 policy
-- ----------------------------------------------------------------------------
drop policy if exists "allow all (dev)" on public.destination_groups;
drop policy if exists "allow all (dev)" on public.radar_watches;
drop policy if exists "allow all (dev)" on public.price_snapshots;
drop policy if exists "allow all (dev)" on public.price_alerts;
drop policy if exists "allow all (dev)" on public.radar_targets;
-- v1 遺留的唯讀 policy（若存在）
drop policy if exists "allow read for all" on public.destination_groups;
drop policy if exists "allow read for all" on public.radar_watches;
drop policy if exists "allow read for all" on public.radar_targets;

-- ----------------------------------------------------------------------------
-- 3. 每人只能讀寫自己的資料
-- ----------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'destination_groups', 'radar_watches', 'price_snapshots',
    'price_alerts', 'radar_targets'
  ] loop
    execute format(
      'create policy "own rows only" on public.%I for all
         using (auth.uid() = user_id)
         with check (auth.uid() = user_id)', t
    );
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- 4.（選用）把遷移前的舊資料指定給某個帳號，否則舊資料對所有人隱藏。
--    先註冊帳號後，到 Authentication → Users 複製該帳號的 UUID 替換下面的值再執行：
-- ----------------------------------------------------------------------------
-- update public.destination_groups set user_id = '你的-user-uuid' where user_id is null;
-- update public.radar_watches     set user_id = '你的-user-uuid' where user_id is null;
-- update public.price_snapshots   set user_id = '你的-user-uuid' where user_id is null;
-- update public.price_alerts      set user_id = '你的-user-uuid' where user_id is null;
