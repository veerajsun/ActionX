"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { UploadDropzone } from "@/components/ui/UploadDropzone";
import { ImagePreview } from "@/components/ui/ImagePreview";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ErrorState } from "@/components/ui/ErrorState";
import { IMAGE_FORMATS } from "@/lib/constants";
import { convertImage, ApiError } from "@/lib/api";
import type { FlowState, ImageFormatId, ImageResult, LoadedImageSource } from "@/lib/types";
import { cn, triggerBrowserDownload } from "@/lib/utils";

const MAX_FILE_BYTES = 20 * 1024 * 1024; // matches the backend's default MAX_IMAGE_FILE_SIZE_MB

export default function ImageConverterPage() {
  const [flow, setFlow] = useState<FlowState>("idle");
  const [source, setSource] = useState<LoadedImageSource | null>(null);
  const [format, setFormat] = useState<ImageFormatId>("WEBP");
  const [quality, setQuality] = useState(85);
  const [resizeEnabled, setResizeEnabled] = useState(true);
  const [width, setWidth] = useState(1920);
  const [height, setHeight] = useState(1080);
  const [keepAspect, setKeepAspect] = useState(true);
  const [aspectRatio, setAspectRatio] = useState(16 / 9);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImageResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  function handleFileSelected(file: File) {
    if (file.size > MAX_FILE_BYTES) {
      setErrorMessage(
        "This image is larger than the 20MB upload limit (configurable via MAX_IMAGE_FILE_SIZE_MB on the backend).",
      );
      setFlow("error");
      return;
    }

    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const previewUrl = URL.createObjectURL(file);
    objectUrlRef.current = previewUrl;

    const img = new window.Image();
    img.onload = () => {
      const originalFormat = (file.type.split("/")[1] || file.name.split(".").pop() || "img")
        .toUpperCase()
        .replace("JPEG", "JPG");
      setSource({
        file,
        previewUrl,
        filename: file.name,
        originalFormat,
        width: img.naturalWidth,
        height: img.naturalHeight,
        sizeBytes: file.size,
      });
      setWidth(img.naturalWidth);
      setHeight(img.naturalHeight);
      setAspectRatio(img.naturalWidth / img.naturalHeight || 1);
      setResult(null);
      setFlow("idle");
    };
    img.onerror = () => {
      setErrorMessage("We couldn't read that file. Please choose a valid image.");
      setFlow("error");
    };
    img.src = previewUrl;
  }

  function handleWidthChange(nextWidth: number) {
    setWidth(nextWidth);
    if (keepAspect && aspectRatio) {
      setHeight(Math.round(nextWidth / aspectRatio));
    }
  }

  function handleHeightChange(nextHeight: number) {
    setHeight(nextHeight);
    if (keepAspect && aspectRatio) {
      setWidth(Math.round(nextHeight * aspectRatio));
    }
  }

  async function handleConvert() {
    if (!source) return;
    setFlow("processing");
    setProgress(0);
    try {
      const converted = await convertImage(
        {
          file: source.file,
          format,
          quality,
          width: resizeEnabled ? width : source.width,
          height: resizeEnabled ? height : source.height,
          keepAspectRatio: keepAspect,
        },
        setProgress,
      );
      setResult(converted);
      setFlow("success");
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : "Conversion failed. Please try again.");
      setFlow("error");
    }
  }

  async function handleSaveToDevice() {
    if (!result) return;
    try {
      await triggerBrowserDownload(result.outputUrl, result.afterLabel);
    } catch {
      window.open(result.outputUrl, "_blank");
    }
  }

  function handleChangeImage() {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = null;
    setSource(null);
    setResult(null);
    setFlow("idle");
  }

  const qualityHint =
    quality > 90 ? "Lossless Visual" : quality < 40 ? "Smallest File" : "Optimal";

  return (
    <div className="flex w-full flex-col gap-space-lg px-gutter pb-space-xl md:mx-auto md:max-w-workspace md:px-gutter-desktop">
      <section className="mt-space-sm flex flex-col gap-space-2xs">
        <div className="flex items-center gap-space-xs">
          <span
            className="material-symbols-outlined text-[20px] text-secondary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            auto_awesome
          </span>
          <span className="font-label-code-sm text-label-code-sm uppercase tracking-wider text-secondary">
            Raster Engine v2.4
          </span>
        </div>
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
          Image Converter
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Convert your images to the format you need.
        </p>
      </section>

      {!source && (
        <section className="w-full">
          <UploadDropzone onFileSelected={handleFileSelected} />
        </section>
      )}

      {flow === "error" && (
        <ErrorState
          title="Something went wrong"
          description={errorMessage}
          errorCode="ERR_IMAGE_PIPELINE"
          responseDetail="Local validation failed before upload"
          onRetry={() => setFlow(source ? "idle" : "idle")}
          onDismiss={handleChangeImage}
        />
      )}

      {source && flow !== "error" && (
        <>
          <ImagePreview source={source} onChangeImage={handleChangeImage} />

          {(flow === "idle" || flow === "processing") && (
            <section className="flex w-full flex-col gap-space-lg rounded-xl bg-surface-container-low p-space-lg shadow-md">
              <div className="flex flex-col gap-space-sm">
                <div className="flex items-center justify-between">
                  <label className="font-headline-sm text-body-md text-on-surface">
                    Output Format
                  </label>
                  <span className="font-label-code-sm text-label-code-sm text-secondary">
                    Modern Next-Gen
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-space-xs">
                  {IMAGE_FORMATS.map((option) => {
                    const isActive = option === format;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setFormat(option)}
                        disabled={flow === "processing"}
                        className={cn(
                          "flex min-h-[44px] items-center justify-center gap-space-2xs rounded font-label-code-lg text-label-code-lg transition-colors",
                          isActive
                            ? "bg-primary-container font-headline-sm text-on-primary shadow-sm"
                            : "bg-surface-container-high text-on-surface-variant hover:text-on-surface",
                        )}
                      >
                        {isActive && <span className="h-1.5 w-1.5 rounded-full bg-on-primary" />}
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-space-xs">
                <div className="flex items-center justify-between">
                  <label htmlFor="quality-range" className="font-headline-sm text-body-md text-on-surface">
                    Quality
                  </label>
                  <span className="font-label-code-sm text-label-code-sm text-primary">
                    {quality}% ({qualityHint})
                  </span>
                </div>
                <input
                  id="quality-range"
                  type="range"
                  min={1}
                  max={100}
                  value={quality}
                  disabled={flow === "processing"}
                  onChange={(event) => setQuality(Number(event.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded bg-surface-container-highest"
                />
                <div className="flex justify-between font-label-code-sm text-label-code-sm text-outline">
                  <span>Faster / Smallest</span>
                  <span>Lossless Visual</span>
                </div>
              </div>

              <div className="flex flex-col gap-space-md rounded-xl bg-surface-container p-space-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
                      aspect_ratio
                    </span>
                    <span className="font-headline-sm text-body-md text-on-surface">
                      Resize Image
                    </span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={resizeEnabled}
                    aria-label="Toggle resize"
                    onClick={() => setResizeEnabled((value) => !value)}
                    className={cn(
                      "flex h-7 w-12 items-center rounded-full p-1 transition-colors",
                      resizeEnabled ? "justify-end bg-primary-container" : "justify-start bg-surface-container-highest",
                    )}
                  >
                    <span className="h-5 w-5 rounded-full bg-on-primary shadow-sm" />
                  </button>
                </div>

                {resizeEnabled && (
                  <>
                    <div className="grid grid-cols-2 gap-space-md">
                      <div className="flex flex-col gap-space-2xs">
                        <label htmlFor="width-input" className="font-label-code-sm text-label-code-sm uppercase text-on-surface-variant">
                          Width (px)
                        </label>
                        <div className="flex min-h-[44px] items-center justify-between rounded bg-surface-container-low px-space-md shadow-inner">
                          <input
                            id="width-input"
                            type="number"
                            value={width}
                            min={1}
                            onChange={(event) => handleWidthChange(Number(event.target.value) || 0)}
                            className="w-full bg-transparent font-label-code-lg text-label-code-lg text-on-surface focus:outline-none"
                          />
                          <span className="font-label-code-sm text-label-code-sm text-outline">W</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-space-2xs">
                        <label htmlFor="height-input" className="font-label-code-sm text-label-code-sm uppercase text-on-surface-variant">
                          Height (px)
                        </label>
                        <div className="flex min-h-[44px] items-center justify-between rounded bg-surface-container-low px-space-md shadow-inner">
                          <input
                            id="height-input"
                            type="number"
                            value={height}
                            min={1}
                            onChange={(event) => handleHeightChange(Number(event.target.value) || 0)}
                            className="w-full bg-transparent font-label-code-lg text-label-code-lg text-on-surface focus:outline-none"
                          />
                          <span className="font-label-code-sm text-label-code-sm text-outline">H</span>
                        </div>
                      </div>
                    </div>
                    <label className="flex cursor-pointer select-none items-center gap-space-xs">
                      <input
                        type="checkbox"
                        checked={keepAspect}
                        onChange={(event) => setKeepAspect(event.target.checked)}
                        className="sr-only"
                      />
                      <span
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded",
                          keepAspect ? "bg-primary-container text-on-primary" : "bg-surface-container-highest text-transparent",
                        )}
                      >
                        <span className="material-symbols-outlined text-[16px]">check</span>
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface">
                        Keep aspect ratio
                      </span>
                    </label>
                  </>
                )}
              </div>

              {flow === "idle" && (
                <button
                  type="button"
                  onClick={handleConvert}
                  className="flex min-h-[48px] w-full items-center justify-center gap-space-xs rounded bg-primary-container font-headline-sm text-body-lg text-on-primary shadow-md transition-transform active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined text-[20px]">bolt</span>
                  Convert Image
                </button>
              )}

              {flow === "processing" && (
                <div className="flex flex-col gap-space-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-space-xs">
                      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-secondary" />
                      <span className="font-headline-sm text-body-md text-on-surface">
                        Converting image...
                      </span>
                    </div>
                    <span className="font-label-code-sm text-label-code-sm text-secondary">
                      {progress}%
                    </span>
                  </div>
                  <ProgressBar
                    percent={progress}
                    colorClassName="bg-secondary"
                    trackClassName="bg-surface-container-highest"
                    label="Image conversion progress"
                  />
                  <div className="flex items-center justify-between pt-space-2xs font-label-code-sm text-label-code-sm text-on-surface-variant">
                    <span>Optimizing {format} compression</span>
                    <span className="text-outline">1.4 MB / s</span>
                  </div>
                </div>
              )}
            </section>
          )}

          {flow === "success" && result && (
            <section className="flex w-full flex-col gap-space-md rounded-xl bg-surface-container-low p-space-lg shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-tertiary-container text-on-tertiary-container">
                    <span className="material-symbols-outlined text-[16px]">check</span>
                  </div>
                  <span className="font-headline-sm text-headline-sm text-on-surface">
                    Image ready
                  </span>
                </div>
                <span className="rounded bg-tertiary-container px-space-xs py-space-2xs font-label-code-sm text-label-code-sm font-semibold text-on-tertiary-container">
                  -{result.savedPercent}% SAVED
                </span>
              </div>

              <div className="grid grid-cols-2 gap-space-sm rounded-xl bg-surface-container-lowest p-space-sm">
                <div className="flex flex-col gap-space-2xs">
                  <div className="relative h-28 w-full overflow-hidden rounded-lg bg-surface-container">
                    <Image
                      src={source.previewUrl}
                      alt={`${result.beforeLabel} before conversion`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <span className="absolute left-1 top-1 rounded bg-surface-container-lowest/80 px-1 font-label-metric text-label-metric text-on-surface">
                      BEFORE
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="truncate font-label-code-sm text-label-code-sm text-outline">
                      {result.beforeLabel}
                    </span>
                    <span className="font-label-code-sm text-label-code-sm font-semibold text-on-surface-variant">
                      {result.beforeSizeLabel}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-space-2xs">
                  <div className="relative h-28 w-full overflow-hidden rounded-lg bg-surface-container">
                    <Image
                      src={result.outputUrl}
                      alt={`${result.afterLabel} after conversion`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <span className="absolute left-1 top-1 rounded bg-primary-container px-1 font-label-metric text-label-metric text-on-primary">
                      AFTER
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="truncate font-label-code-sm text-label-code-sm text-tertiary">
                      {result.afterLabel}
                    </span>
                    <span className="font-label-code-sm text-label-code-sm font-semibold text-tertiary">
                      {result.afterSizeLabel}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-space-xs rounded bg-surface-container p-space-xs text-center">
                <div className="flex flex-col py-space-2xs">
                  <span className="font-label-code-sm text-label-code-sm uppercase text-outline">
                    Format
                  </span>
                  <span className="font-label-code-lg text-label-code-lg text-on-surface">
                    {result.format}
                  </span>
                </div>
                <div className="flex flex-col py-space-2xs">
                  <span className="font-label-code-sm text-label-code-sm uppercase text-outline">
                    Target Res
                  </span>
                  <span className="font-label-code-lg text-label-code-lg text-on-surface">
                    {result.targetResolution}
                  </span>
                </div>
                <div className="flex flex-col py-space-2xs">
                  <span className="font-label-code-sm text-label-code-sm uppercase text-outline">
                    Final Size
                  </span>
                  <span className="font-label-code-lg text-label-code-lg text-tertiary">
                    {result.finalSizeLabel}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-space-xs pt-space-2xs">
                <button
                  type="button"
                  onClick={handleSaveToDevice}
                  className="flex min-h-[44px] w-full items-center justify-center gap-space-xs rounded bg-tertiary font-headline-sm text-body-md text-on-tertiary shadow-md transition-transform active:scale-95"
                >
                  <span className="material-symbols-outlined text-[20px]">download</span>
                  Download Image
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setResult(null);
                    setFlow("idle");
                  }}
                  className="flex min-h-[44px] w-full items-center justify-center gap-space-xs rounded bg-surface-container-highest font-headline-sm text-body-md text-on-surface transition-transform active:scale-95"
                >
                  <span className="material-symbols-outlined text-[20px]">restart_alt</span>
                  Convert Another
                </button>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
