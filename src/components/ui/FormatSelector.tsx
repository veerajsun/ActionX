import { cn } from "@/lib/utils";

export interface FormatOption {
  id: string;
  label: string;
  sublabel?: string;
}

interface FormatSelectorProps {
  options: FormatOption[];
  value: string;
  onChange: (id: string) => void;
  columns?: 2 | 3;
  /** Text color applied to the selected pill's label, e.g. "text-secondary". */
  activeTextClassName?: string;
  /** Background color applied to the small indicator dot, e.g. "bg-primary". */
  dotClassName?: string;
  label?: string;
}

/**
 * Segmented format picker used by both the Video Downloader (MP4 / WebM)
 * and Video to Audio (MP3 / M4A / WAV) tools.
 */
export function FormatSelector({
  options,
  value,
  onChange,
  columns = 2,
  activeTextClassName = "text-on-surface",
  dotClassName = "bg-primary",
  label,
}: FormatSelectorProps) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        "grid gap-space-2xs rounded-lg bg-surface-container-lowest p-space-2xs",
        columns === 2 ? "grid-cols-2" : "grid-cols-3",
      )}
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
              "flex min-h-[42px] flex-col items-center justify-center gap-space-2xs rounded py-space-xs font-label-code-lg text-label-code-lg transition-all",
              isActive
                ? cn("bg-surface-container-high font-semibold shadow-sm", activeTextClassName)
                : "font-medium text-on-surface-variant hover:text-on-surface",
            )}
          >
            <span className="flex items-center gap-space-2xs">
              {isActive && <span className={cn("h-1.5 w-1.5 rounded-full", dotClassName)} />}
              <span>{option.label}</span>
            </span>
            {option.sublabel && (
              <span
                className={cn(
                  "text-[9px]",
                  isActive ? activeTextClassName : "text-outline",
                )}
              >
                {option.sublabel}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
