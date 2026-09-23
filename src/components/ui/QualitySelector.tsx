import { cn } from "@/lib/utils";
import type { VideoQualityOption } from "@/lib/types";

interface QualitySelectorProps {
  options: VideoQualityOption[];
  value: string;
  onChange: (id: string) => void;
}

/** 2-column resolution/size grid used by the Video Downloader tool. */
export function QualitySelector({ options, value, onChange }: QualitySelectorProps) {
  return (
    <div role="radiogroup" aria-label="Choose quality" className="grid grid-cols-2 gap-space-xs">
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
              "flex flex-col justify-between rounded-lg p-space-sm text-left transition-colors",
              isActive ? "bg-surface-container-highest shadow-sm" : "bg-surface-container-low",
            )}
          >
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  "font-label-code-lg text-label-code-lg text-on-surface",
                  isActive && "font-semibold",
                )}
              >
                {option.label}
              </span>
              {option.badge && (
                <span
                  className={cn(
                    "rounded px-1 py-0.5 font-label-metric text-label-metric",
                    option.badge === "BEST"
                      ? "bg-tertiary-container/30 text-tertiary"
                      : "bg-secondary-container/20 text-secondary",
                  )}
                >
                  {option.badge}
                </span>
              )}
            </div>
            <span
              className={cn(
                "font-label-code-sm text-label-code-sm",
                isActive ? "font-medium text-tertiary" : "text-outline",
              )}
            >
              {option.sizeEstimate}
            </span>
          </button>
        );
      })}
    </div>
  );
}
