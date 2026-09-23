"use client";

import type { KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

interface URLInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Reusable URL ingestion field used by the Video Downloader and Video to
 * Audio tools. Includes a clipboard-paste affordance and clear button, and
 * submits on Enter.
 */
export function URLInput({
  id,
  value,
  onChange,
  onSubmit,
  placeholder = "Paste your video link here...",
  disabled,
  className,
}: URLInputProps) {
  async function handlePaste() {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        onChange(text);
      }
    } catch {
      // Clipboard access can be denied by the browser; the input stays focusable either way.
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      onSubmit?.();
    }
  }

  return (
    <div
      className={cn(
        "relative flex items-center rounded-lg bg-surface-container-lowest px-space-sm py-space-2xs shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]",
        className,
      )}
    >
      <span className="material-symbols-outlined mr-space-xs flex-shrink-0 text-[20px] text-outline">
        link
      </span>
      <input
        id={id}
        type="url"
        inputMode="url"
        autoComplete="off"
        spellCheck={false}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        className="min-w-0 w-full truncate bg-transparent py-space-sm font-label-code-lg text-label-code-lg text-on-surface placeholder:text-outline focus:outline-none"
      />
      {value ? (
        <button
          type="button"
          aria-label="Clear input"
          onClick={() => onChange("")}
          className="flex min-h-[44px] min-w-[44px] flex-shrink-0 items-center justify-center p-space-xs text-outline transition-colors hover:text-on-surface"
        >
          <span className="material-symbols-outlined text-[18px]">cancel</span>
        </button>
      ) : (
        <button
          type="button"
          aria-label="Paste from clipboard"
          onClick={handlePaste}
          className="flex min-h-[44px] flex-shrink-0 items-center gap-space-2xs rounded px-space-xs py-space-2xs font-label-code-sm text-label-code-sm text-primary transition-colors hover:bg-surface-variant"
        >
          <span className="material-symbols-outlined text-[16px]">content_paste</span>
          <span>Paste</span>
        </button>
      )}
    </div>
  );
}
