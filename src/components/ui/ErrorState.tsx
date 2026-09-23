interface ErrorStateProps {
  title: string;
  description: string;
  errorCode: string;
  responseDetail: string;
  onRetry: () => void;
  onDismiss: () => void;
}

/** Shared error card with a diagnostic pane, retry and dismiss actions. */
export function ErrorState({
  title,
  description,
  errorCode,
  responseDetail,
  onRetry,
  onDismiss,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col gap-space-md rounded-xl bg-surface-container p-space-md shadow-lg">
      <div className="flex items-start gap-space-sm">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-error-container/20 text-error">
          <span className="material-symbols-outlined text-[22px]">error</span>
        </div>
        <div className="flex flex-col gap-space-2xs">
          <h3 className="font-headline-sm text-body-md font-semibold text-on-surface">{title}</h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant">{description}</p>
        </div>
      </div>

      <div className="flex flex-col gap-space-2xs rounded-lg bg-surface-container-lowest p-space-sm font-label-code-sm text-label-code-sm">
        <div className="flex items-center justify-between text-outline">
          <span>Error Code:</span>
          <span className="font-medium text-error">{errorCode}</span>
        </div>
        <div className="flex items-center justify-between text-outline">
          <span>Response:</span>
          <span>{responseDetail}</span>
        </div>
      </div>

      <div className="flex items-center gap-space-sm pt-space-xs">
        <button
          type="button"
          onClick={onRetry}
          className="flex min-h-[44px] flex-1 items-center justify-center gap-space-xs rounded-lg bg-primary-container font-headline-sm text-body-md font-medium text-on-primary-container shadow-md"
        >
          <span className="material-symbols-outlined text-[18px]">replay</span>
          <span>Try Again</span>
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="min-h-[44px] rounded-lg bg-surface-container-high px-space-md font-headline-sm text-body-md text-on-surface"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
