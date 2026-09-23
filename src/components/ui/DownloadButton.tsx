interface DownloadButtonProps {
  label: string;
  onClick: () => void;
  icon?: string;
}

/** Primary "download ready file" action, styled with the tertiary (success) accent. */
export function DownloadButton({ label, onClick, icon = "download" }: DownloadButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[48px] w-full items-center justify-center gap-space-xs rounded-lg bg-tertiary-container font-headline-sm text-body-md font-semibold text-on-tertiary-container shadow-md transition-transform active:scale-[0.98]"
    >
      <span className="material-symbols-outlined text-[20px]">{icon}</span>
      <span>{label}</span>
    </button>
  );
}
