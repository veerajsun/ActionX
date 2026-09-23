interface LoadingStateProps {
  title: string;
  description: string;
  logLines?: string[];
}

/** Shared "analyzing" / probing visual used before a result is ready. */
export function LoadingState({ title, description, logLines }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center rounded-xl bg-surface-container p-space-xl text-center shadow-lg">
      <div className="relative mb-space-md flex h-16 w-16 items-center justify-center">
        <div className="absolute inset-0 animate-ping rounded-full bg-primary-container/30" />
        <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-primary-container text-on-primary-container shadow-md">
          <span className="material-symbols-outlined animate-spin text-[24px]">sync</span>
        </div>
      </div>
      <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">{title}</h3>
      <p className="mt-space-2xs max-w-xs font-body-sm text-body-sm text-on-surface-variant">
        {description}
      </p>
      {logLines && logLines.length > 0 && (
        <div className="mt-space-lg flex w-full flex-col gap-space-xs rounded-lg bg-surface-container-lowest p-space-sm text-left font-label-code-sm text-label-code-sm text-outline">
          {logLines.map((line, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className={index === 0 ? "text-tertiary" : undefined}>{line}</span>
              {index === logLines.length - 1 && <span className="text-secondary">active</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
