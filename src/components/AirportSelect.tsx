"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  AIRPORTS,
  REGIONS,
  airportLabel,
  findAirport,
  searchAirports,
  type Airport,
} from "@/lib/airports";

// 機場選擇器：
// - 未輸入時：全部 155 個機場按地區分組瀏覽（台灣/日本/韓國/東南亞/歐美…）
// - 輸入中文（東京）、英文（tokyo）或代碼（NRT）即模糊搜尋
// - 也接受直接輸入未收錄的 3 碼代號

const inputCls =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none";

export function AirportSelect({
  value,
  onChange,
  placeholder = "輸入城市或代碼",
  ariaLabel,
}: {
  value: string;
  onChange: (code: string) => void;
  placeholder?: string;
  ariaLabel?: string;
}) {
  const [text, setText] = useState(value ? airportLabel(value) : "");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  // 外部值變動（例如表單重置）時同步顯示文字。
  useEffect(() => {
    setText(value ? airportLabel(value) : "");
  }, [value]);

  // 點擊元件外部時關閉下拉。
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // 已選定時聚焦（文字＝選定標籤）視為未輸入 → 進入分組瀏覽模式。
  const effectiveQuery =
    value && text === airportLabel(value) ? "" : text.trim();
  const browsing = effectiveQuery === "";
  const results = browsing ? AIRPORTS : searchAirports(effectiveQuery);
  const rawCode = effectiveQuery.toUpperCase();
  const isRawCode = /^[A-Z]{3}$/.test(rawCode) && !findAirport(rawCode);
  const optionCount = results.length + (isRawCode ? 1 : 0);

  const pick = (code: string) => {
    onChange(code);
    setText(airportLabel(code));
    setOpen(false);
  };

  const moveHighlight = (next: number) => {
    setHighlight(next);
    document
      .getElementById(`${listId}-opt-${next}`)
      ?.scrollIntoView({ block: "nearest" });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      moveHighlight(Math.min(highlight + 1, optionCount - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      moveHighlight(Math.max(highlight - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlight < results.length) {
        pick(results[highlight].code);
      } else if (isRawCode) {
        pick(rawCode);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const renderOption = (airport: Airport, index: number) => (
    <button
      key={airport.code}
      id={`${listId}-opt-${index}`}
      type="button"
      role="option"
      aria-selected={highlight === index}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => pick(airport.code)}
      onMouseEnter={() => setHighlight(index)}
      className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm ${
        highlight === index ? "bg-slate-100" : ""
      }`}
    >
      <span className="text-slate-800">
        {airport.zh}
        <span className="ml-1.5 text-xs text-slate-400">{airport.en}</span>
      </span>
      <span className="ml-2 shrink-0 font-mono text-xs font-semibold text-slate-500">
        {airport.code}
      </span>
    </button>
  );

  return (
    <div ref={rootRef} className="relative">
      <input
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          onChange(""); // 重新輸入即視為未選定
          setOpen(true);
          setHighlight(0);
        }}
        onFocus={(e) => {
          setOpen(true);
          setHighlight(0);
          e.target.select();
        }}
        onKeyDown={handleKeyDown}
        className={inputCls}
        placeholder={placeholder}
        aria-label={ariaLabel}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        autoComplete="off"
      />

      {open ? (
        <div
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-20 mt-1 max-h-72 overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          {browsing
            ? // 分組瀏覽：地區標題 + 該區機場
              REGIONS.map((region) => (
                <div key={region}>
                  <div className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50 px-3 py-1 text-[10px] font-bold tracking-wide text-slate-400">
                    {region}
                  </div>
                  {AIRPORTS.map((airport, index) =>
                    airport.region === region
                      ? renderOption(airport, index)
                      : null
                  )}
                </div>
              ))
            : results.map((airport, index) => renderOption(airport, index))}

          {isRawCode ? (
            <button
              type="button"
              id={`${listId}-opt-${results.length}`}
              role="option"
              aria-selected={highlight === results.length}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(rawCode)}
              onMouseEnter={() => setHighlight(results.length)}
              className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm ${
                highlight === results.length ? "bg-slate-100" : ""
              }`}
            >
              <span className="text-slate-600">
                使用機場代碼「
                <span className="font-mono font-semibold">{rawCode}</span>」
              </span>
            </button>
          ) : null}

          {!browsing && results.length === 0 && !isRawCode ? (
            <div className="px-3 py-2 text-sm text-slate-400">
              找不到符合的機場，可直接輸入 3 碼機場代號
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
