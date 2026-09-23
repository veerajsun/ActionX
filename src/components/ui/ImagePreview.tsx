import Image from "next/image";
import type { LoadedImageSource } from "@/lib/types";
import { formatBytes } from "@/lib/utils";

interface ImagePreviewProps {
  source: LoadedImageSource;
  onChangeImage: () => void;
}

/** "Loaded source" card shown once an image has been picked. */
export function ImagePreview({ source, onChangeImage }: ImagePreviewProps) {
  return (
    <section className="flex w-full flex-col gap-space-sm rounded-xl bg-surface-container p-space-md shadow-md">
      <div className="flex items-center justify-between pb-space-xs">
        <span className="font-label-code-sm text-label-code-sm uppercase tracking-wider text-outline">
          Loaded Source
        </span>
        <button
          type="button"
          onClick={onChangeImage}
          className="flex items-center gap-space-2xs font-label-code-sm text-label-code-sm text-primary hover:underline"
        >
          <span className="material-symbols-outlined text-[14px]">swap_horiz</span>
          Change Image
        </button>
      </div>
      <div className="flex items-center gap-space-md">
        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-surface-container-lowest shadow-sm">
          <Image src={source.previewUrl} alt={source.filename} fill className="object-cover" unoptimized />
          <span className="absolute bottom-1 right-1 rounded bg-surface-container-lowest/90 px-1 font-label-metric text-label-metric text-on-surface">
            {source.originalFormat}
          </span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-headline-sm text-body-lg text-on-surface">
            {source.filename}
          </span>
          <div className="mt-space-2xs flex items-center gap-space-xs text-on-surface-variant">
            <span className="font-label-code-sm text-label-code-sm text-tertiary">
              {source.width} × {source.height} px
            </span>
            <span className="text-body-sm text-outline">•</span>
            <span className="font-label-code-sm text-label-code-sm">
              {formatBytes(source.sizeBytes)}
            </span>
          </div>
          <div className="mt-space-xs flex items-center gap-space-xs">
            <span className="h-2 w-2 rounded-full bg-tertiary" />
            <span className="font-label-metric text-label-metric uppercase text-on-surface-variant">
              Ready for engine pipeline
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
