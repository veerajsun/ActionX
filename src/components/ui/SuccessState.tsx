import type { ReactNode } from "react";

interface SuccessStateProps {
  title: string;
  description: string;
  badge?: string;
  children?: ReactNode;
  onReset: () => void;
  resetLabel: string;
  downloadSlot: ReactNode;
}

/** Shared success card shell: icon + title, optional file-info children, then actions. */
export function SuccessState({
  title,
  description,
  badge,
  children,
  onReset,
  resetLabel,
  downloadSlot,
}: SuccessStateProps) {
  return (
    <div className="flex flex-col gap-space-md rounded-xl bg-surface-container p-space-lg shadow-lg">
      <div className="flex flex-col items-center text-center">
        <div className="mb-space-sm flex h-14 w-14 items-center justify-center rounded-full bg-tertiary-container text-on-tertiary-container shadow-md">
          <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            check_circle
          </span>
        </div>
        <div className="flex items-center gap-space-xs">
          <h3 className="font-headline-md text-headline-sm font-semibold text-on-surface">
            {title}
          </h3>
          {badge && (
            <span className="rounded bg-tertiary-container/30 px-space-xs py-[1px] font-label-code-sm text-label-code-sm text-tertiary">
              {badge}
            </span>
          )}
        </div>
        <p className="mt-space-2xs max-w-xs font-body-sm text-body-sm text-on-surface-variant">
          {description}
        </p>
      </div>

      {children}

      <div className="flex w-full flex-col gap-space-xs">
        {downloadSlot}
        <button
          type="button"
          onClick={onReset}
          className="flex min-h-[44px] w-full items-center justify-center gap-space-xs rounded-lg bg-surface-container-high font-headline-sm text-body-md font-medium text-on-surface transition-colors hover:bg-surface-bright"
        >
          <span className="material-symbols-outlined text-[18px]">restart_alt</span>
          <span>{resetLabel}</span>
        </button>
      </div>
    </div>
  );
}
