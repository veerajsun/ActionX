import { cn } from "@/lib/utils";

interface ProgressBarProps {
  percent: number;
  colorClassName?: string;
  trackClassName?: string;
  className?: string;
  label?: string;
}

/** Linear progress trough used across all three tools' processing states. */
export function ProgressBar({
  percent,
  colorClassName = "bg-primary-container",
  trackClassName = "bg-surface-container-lowest",
  className,
  label,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn("h-2 w-full overflow-hidden rounded-full", trackClassName, className)}
    >
      <div
        className={cn("h-full rounded-full transition-all duration-300", colorClassName)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
