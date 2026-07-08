"use client";

import { useState } from "react";
import { AirportSelect } from "@/components/AirportSelect";
import { airportLabel } from "@/lib/airports";
import { createGroupAction } from "@/app/actions";
import { SubmitButton } from "@/components/SubmitButton";

const inputCls =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none";
const labelCls = "mb-1 block text-xs font-medium text-slate-500";

// 建立目的地群組：命名 + 用機場選擇器把多個機場加成一組。
export function GroupForm() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [codes, setCodes] = useState<string[]>([]);
  const [picker, setPicker] = useState("");

  const addCode = (code: string) => {
    if (!code) return;
    setCodes((current) =>
      current.includes(code) ? current : [...current, code]
    );
    // 立刻清空選擇器，方便連續加下一個
    setPicker("");
  };

  const submit = async (formData: FormData) => {
    await createGroupAction(formData);
    setName("");
    setDescription("");
    setCodes([]);
  };

  return (
    <form action={submit} className="flex flex-col gap-4">
      <input type="hidden" name="airport_codes" value={JSON.stringify(codes)} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="group-name">
            群組名稱
          </label>
          <input
            id="group-name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputCls}
            placeholder="例如：東京雙機場"
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="group-description">
            說明（選填）
          </label>
          <input
            id="group-description"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputCls}
            placeholder="例如：成田＋羽田"
          />
        </div>
      </div>

      <div>
        <span className={labelCls}>加入機場（選一個自動加入，可連續加）</span>
        <AirportSelect
          value={picker}
          onChange={addCode}
          placeholder="輸入城市或代碼，例如：東京"
          ariaLabel="加入機場"
        />
        {codes.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {codes.map((code) => (
              <span
                key={code}
                className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700"
              >
                {airportLabel(code)}
                <button
                  type="button"
                  onClick={() =>
                    setCodes((current) => current.filter((c) => c !== code))
                  }
                  className="text-slate-400 hover:text-slate-600"
                  aria-label={`移除 ${code}`}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-xs text-slate-400">
            尚未加入機場，至少加入 1 個
          </p>
        )}
      </div>

      <SubmitButton
        disabled={!name.trim() || codes.length === 0}
        pendingText="建立中…"
        className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        建立群組
      </SubmitButton>
    </form>
  );
}
