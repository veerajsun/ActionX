import Image from "next/image";

interface MediaPreviewProps {
  thumbnailUrl: string;
  title: string;
  host: string;
  durationLabel: string;
  fps?: number;
  alt: string;
}

/** 16:9 cinematic media preview frame used on the Video Downloader result state. */
export function MediaPreview({ thumbnailUrl, title, host, durationLabel, fps, alt }: MediaPreviewProps) {
  return (
    <div className="relative aspect-video w-full overflow-hidden bg-surface-container-lowest">
      <Image src={thumbnailUrl} alt={alt} fill sizes="(min-width: 768px) 640px, 100vw" className="object-cover" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-surface-container-lowest/90 via-transparent to-black/30" />

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-dim/80 text-primary shadow-lg backdrop-blur-md transition-transform hover:scale-105">
          <span
            className="material-symbols-outlined translate-x-0.5 text-[28px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            play_arrow
          </span>
        </div>
      </div>

      <div className="absolute left-space-sm top-space-sm flex items-center gap-space-xs">
        <span className="rounded bg-surface-dim/85 px-space-xs py-space-2xs font-label-code-sm text-label-code-sm text-on-surface shadow-sm backdrop-blur-md">
          {host}
        </span>
        {fps && (
          <span className="flex items-center gap-0.5 rounded bg-tertiary-container/80 px-space-xs py-space-2xs font-label-code-sm text-label-code-sm text-on-tertiary-container shadow-sm backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-tertiary" /> {fps} FPS
          </span>
        )}
      </div>
      <div className="absolute bottom-space-sm right-space-sm">
        <span className="rounded bg-surface-dim/90 px-space-xs py-space-2xs font-label-code-sm text-label-code-sm text-on-surface shadow-sm backdrop-blur-md">
          {durationLabel}
        </span>
      </div>
      <span className="sr-only">{title}</span>
    </div>
  );
}
