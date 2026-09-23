"use client";

import { useRef, useState, type DragEvent } from "react";
import { cn } from "@/lib/utils";

interface UploadDropzoneProps {
  onFileSelected: (file: File) => void;
  accept?: string;
  acceptedLabels?: string[];
}

/** Drag-and-drop / click-to-browse upload well used by the Image Converter tool. */
export function UploadDropzone({
  onFileSelected,
  accept = "image/*",
  acceptedLabels = ["JPG", "PNG", "WEBP", "GIF", "BMP", "TIFF"],
}: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file) onFileSelected(file);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    handleFiles(event.dataTransfer.files);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Upload an image, drag and drop or click to browse"
      onClick={() => inputRef.current?.click()}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "group relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed p-space-lg text-center shadow-md transition-all active:scale-[0.99]",
        isDragging
          ? "border-primary-container bg-surface-container-low/80"
          : "border-transparent bg-surface-container-low",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(event) => handleFiles(event.target.files)}
      />
      <div className="mb-space-sm flex h-14 w-14 items-center justify-center rounded-full bg-surface-container-highest text-primary shadow-sm transition-transform group-hover:scale-105">
        <span className="material-symbols-outlined text-[30px]">cloud_upload</span>
      </div>
      <span className="font-headline-sm text-headline-sm text-on-surface">
        Drop your image here
      </span>
      <span className="mt-space-2xs font-body-sm text-body-sm text-on-surface-variant">
        or click to browse
      </span>
      <div className="mt-space-md flex max-w-[280px] flex-wrap items-center justify-center gap-space-2xs">
        {acceptedLabels.map((label) => (
          <span
            key={label}
            className="rounded bg-surface-container-high px-space-xs py-space-2xs font-label-code-sm text-label-code-sm text-on-surface-variant"
          >
            {label}
          </span>
        ))}
      </div>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          inputRef.current?.click();
        }}
        className="mt-space-md flex min-h-[44px] items-center gap-space-xs rounded bg-surface-container-highest px-space-lg py-space-xs font-headline-sm text-body-md text-on-surface shadow-sm transition-all hover:bg-surface-bright active:scale-95"
      >
        <span className="material-symbols-outlined text-[18px]">add_photo_alternate</span>
        Choose Image
      </button>
    </div>
  );
}
