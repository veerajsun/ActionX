import { cn } from "@/lib/utils";
import type { AudioQualityOption } from "@/lib/types";

interface AudioQualitySelectorProps {
  options: AudioQualityOption[];
  value: string;
  onChange: (id: string) => void;
}

/** 4-column bitrate grid used by the Video to Audio tool. */
export function AudioQualitySelector({ options, value, onChange }: AudioQualitySelectorProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Audio bitrate / quality"
      className="grid grid-cols-4 gap-space-xs rounded-lg bg-surface-container-lowest p-space-2xs"
    >
      {options.map((option) => {
        const isActive = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(option.id)}
            className={cn(
              "flex min-h-[40px] flex-col items-center justify-center rounded-lg font-label-code-sm text-label-code-sm transition-all",
              isActive
                ? "bg-surface-container-high font-semibold text-secondary shadow-sm"
                : "text-outline hover:text-on-surface",
            )}
          >
            <span>{option.kbps}</span>
            <span className={cn("text-[9px]", isActive ? "text-secondary" : "text-outline")}>
              {option.isMax ? "kbps MAX" : "kbps"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
