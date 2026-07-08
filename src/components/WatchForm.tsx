"use client";

import { useState } from "react";
import type { DestinationGroup, FlightSegment, TripType } from "@/lib/types";
import { AirportSelect } from "@/components/AirportSelect";

const TRIP_TYPES: { value: TripType; label: string; hint: string }[] = [
  { value: "one_way", label: "單程", hint: "A → B" },
  { value: "round_trip", label: "來回", hint: "A ⇄ B" },
  { value: "multi_city", label: "外站票", hint: "4 段以上" },
];

const MIN_SEGMENTS = 4;

const emptySegment = (): FlightSegment => ({
  origin: "",
  destination: "",
  depart_date: null,
});

const inputCls =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none";
const labelCls = "mb-1 block text-xs font-medium text-slate-500";

export function WatchForm({
  action,
  groups = [],
}: {
  action: (formData: FormData) => Promise<void>;
  groups?: DestinationGroup[];
}) {
  const [tripType, setTripType] = useState<TripType>("one_way");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  // 目的地模式：單一機場或目的地群組
  const [destMode, setDestMode] = useState<"airport" | "group">("airport");
  const [groupId, setGroupId] = useState("");
  const [segments, setSegments] = useState<FlightSegment[]>(() =>
    Array.from({ length: MIN_SEGMENTS }, emptySegment)
  );

  const setSegment = (
    index: number,
    key: keyof FlightSegment,
    value: string
  ) => {
    setSegments((current) =>
      current.map((seg, i) =>
        i === index ? { ...seg, [key]: value || (key === "depart_date" ? null : "") } : seg
      )
    );
  };

  const isMulti = tripType === "multi_city";
  const useGroup = !isMulti && destMode === "group";
  const formValid = isMulti
    ? segments.length >= MIN_SEGMENTS &&
      segments.every((s) => s.origin.trim() && s.destination.trim())
    : Boolean(origin && (useGroup ? groupId : destination));

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="trip_type" value={tripType} />
      <input type="hidden" name="segments" value={JSON.stringify(segments)} />
      <input type="hidden" name="origin" value={origin} />
      <input
        type="hidden"
        name="destination"
        value={useGroup ? "" : destination}
      />
      <input
        type="hidden"
        name="destination_group_id"
        value={useGroup ? groupId : ""}
      />

      {/* 行程類型 */}
      <div>
        <span className={labelCls}>行程類型</span>
        <div className="grid grid-cols-3 gap-2">
          {TRIP_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTripType(t.value)}
              className={`rounded-lg border px-3 py-2.5 text-center transition-colors ${
                tripType === t.value
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-300 bg-white text-slate-600 hover:border-slate-400"
              }`}
            >
              <div className="text-sm font-semibold">{t.label}</div>
              <div
                className={`text-xs ${tripType === t.value ? "text-slate-300" : "text-slate-400"}`}
              >
                {t.hint}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 名稱 */}
      <div>
        <label className={labelCls} htmlFor="watch-name">
          航段名稱（留空自動命名）
        </label>
        <input
          id="watch-name"
          name="name"
          className={inputCls}
          placeholder="例如：暑假東京行"
        />
      </div>

      {/* 單程 / 來回 航線 */}
      {!isMulti && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <span className={labelCls}>出發機場</span>
            <AirportSelect
              value={origin}
              onChange={setOrigin}
              placeholder="例如：台北、TPE"
              ariaLabel="出發機場"
            />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">
                {useGroup ? "目的地群組" : "抵達機場"}
              </span>
              {groups.length > 0 ? (
                <div className="flex gap-1 text-xs">
                  {(
                    [
                      { value: "airport", label: "機場" },
                      { value: "group", label: "群組" },
                    ] as const
                  ).map((mode) => (
                    <button
                      key={mode.value}
                      type="button"
                      onClick={() => setDestMode(mode.value)}
                      className={`rounded px-1.5 py-0.5 transition-colors ${
                        destMode === mode.value
                          ? "bg-slate-900 text-white"
                          : "text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            {useGroup ? (
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className={inputCls}
                aria-label="目的地群組"
              >
                <option value="">選擇群組…</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}（{g.airport_codes.join("・")}）
                  </option>
                ))}
              </select>
            ) : (
              <AirportSelect
                value={destination}
                onChange={setDestination}
                placeholder="例如：東京、NRT"
                ariaLabel="抵達機場"
              />
            )}
          </div>
          <div>
            <label className={labelCls} htmlFor="watch-depart">
              出發日期
            </label>
            <input
              id="watch-depart"
              name="depart_date"
              type="date"
              className={inputCls}
            />
          </div>
          {tripType === "round_trip" && (
            <div>
              <label className={labelCls} htmlFor="watch-return">
                回程日期
              </label>
              <input
                id="watch-return"
                name="return_date"
                type="date"
                className={inputCls}
              />
            </div>
          )}
        </div>
      )}

      {/* 外站票 segments */}
      {isMulti && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              航段（外站票需 4 段以上）
            </span>
            <button
              type="button"
              onClick={() => setSegments((s) => [...s, emptySegment()])}
              className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:border-slate-400"
            >
              ＋ 加一段
            </button>
          </div>
          <div className="flex flex-col gap-3 sm:gap-2">
            {segments.map((seg, i) => (
              <div
                key={i}
                className="rounded-lg border border-slate-200 p-2.5 sm:border-0 sm:p-0"
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 shrink-0 text-center text-xs font-semibold text-slate-400">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <AirportSelect
                      value={seg.origin}
                      onChange={(code) => setSegment(i, "origin", code)}
                      placeholder="出發"
                      ariaLabel={`第 ${i + 1} 段出發機場`}
                    />
                  </div>
                  <span className="shrink-0 text-slate-400">→</span>
                  <div className="min-w-0 flex-1">
                    <AirportSelect
                      value={seg.destination}
                      onChange={(code) => setSegment(i, "destination", code)}
                      placeholder="抵達"
                      ariaLabel={`第 ${i + 1} 段抵達機場`}
                    />
                  </div>
                  <input
                    value={seg.depart_date ?? ""}
                    onChange={(e) =>
                      setSegment(i, "depart_date", e.target.value)
                    }
                    type="date"
                    className={`${inputCls} hidden w-40 shrink-0 sm:block`}
                    aria-label={`第 ${i + 1} 段日期`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setSegments((s) => s.filter((_, idx) => idx !== i))
                    }
                    disabled={segments.length <= MIN_SEGMENTS}
                    className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label={`移除第 ${i + 1} 段`}
                  >
                    ✕
                  </button>
                </div>
                {/* 手機：日期換行顯示 */}
                <input
                  value={seg.depart_date ?? ""}
                  onChange={(e) => setSegment(i, "depart_date", e.target.value)}
                  type="date"
                  className={`${inputCls} ml-8 mt-2 w-[calc(100%-2rem)] sm:hidden`}
                  aria-label={`第 ${i + 1} 段日期`}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 每天掃描時間 + 價格門檻（頻率固定為每天一次） */}
      <input type="hidden" name="frequency_minutes" value={1440} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="watch-scan-hour">
            每天掃描時間（台灣時間）
          </label>
          <select
            id="watch-scan-hour"
            name="scan_hour"
            defaultValue={8}
            className={inputCls}
          >
            {Array.from({ length: 24 }, (_, h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, "0")}:00
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="watch-max-price">
            價格門檻 TWD（選填）
          </label>
          <input
            id="watch-max-price"
            name="max_price"
            type="number"
            min={0}
            className={inputCls}
            placeholder="低於此價立即警示"
          />
        </div>
      </div>

      <p className="text-xs text-slate-400">
        每天在你選的時間自動掃描一次；除了門檻價之外，只要掃到的價格低於「當月平均票價」就會跳出警示。
      </p>

      <button
        type="submit"
        disabled={!formValid}
        className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        建立航段
      </button>
    </form>
  );
}
