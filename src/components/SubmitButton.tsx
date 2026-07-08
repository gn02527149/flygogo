"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

/**
 * 表單送出按鈕：送出期間自動顯示轉圈與提示文字，並停用按鈕防止連點。
 * 必須放在 <form> 內（依賴 useFormStatus）。
 */
export function SubmitButton({
  children,
  pendingText,
  className = "",
  disabled = false,
}: {
  children: ReactNode;
  // 送出中顯示的文字；未提供則沿用原文字
  pendingText?: string;
  className?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      aria-busy={pending}
      className={`${className} ${pending ? "cursor-wait opacity-70" : ""}`}
    >
      {pending ? (
        <span className="inline-flex items-center justify-center gap-1.5">
          <span
            className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden
          />
          {pendingText ?? children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
