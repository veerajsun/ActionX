"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { URLInput } from "@/components/ui/URLInput";
import { MediaPreview } from "@/components/ui/MediaPreview";
import { FormatSelector } from "@/components/ui/FormatSelector";
import { QualitySelector } from "@/components/ui/QualitySelector";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SuccessState } from "@/components/ui/SuccessState";
import { DownloadButton } from "@/components/ui/DownloadButton";
import { analyzeVideo, downloadVideo, ApiError } from "@/lib/api";
import type { AnalyzedVideo, DownloadResult, FlowState } from "@/lib/types";
import { looksLikeUrl, triggerBrowserDownload } from "@/lib/utils";

const ENGINE_CAPABILITIES = [
  {
    icon: "high_res",
    accent: "text-primary",
    title: "Up to 4K 60FPS",
    description: "Lossless extraction directly from provider content distribution edges.",
  },
  {
    icon: "bolt",
    accent: "text-tertiary",
    title: "GPU Demuxing",
    description: "Parallel chunk download with instant local format encapsulation.",
  },
];

function VideoDownloaderContent() {
  const searchParams = useSearchParams();
  const [url, setUrl] = useState("");
  const [flow, setFlow] = useState<FlowState>("idle");
  const [video, setVideo] = useState<AnalyzedVideo | null>(null);
  const [formatId, setFormatId] = useState("mp4");
  const [qualityId, setQualityId] = useState("1080p");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<DownloadResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const prefill = searchParams.get("url");
    if (prefill) setUrl(prefill);
  }, [searchParams]);

  const runAnalyze = useCallback(async (targetUrl: string) => {
    if (!looksLikeUrl(targetUrl)) return;
    setFlow("analyzing");
    try {
      const analyzed = await analyzeVideo(targetUrl);
      setVideo(analyzed);
      setFormatId(analyzed.formats[0]?.id ?? "mp4");
      setQualityId("1080p");
      setFlow("ready");
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : "Something went wrong.");
      setFlow("error");
    }
  }, []);

  useEffect(() => {
    const prefill = searchParams.get("url");
    if (prefill && looksLikeUrl(prefill)) {
      void runAnalyze(prefill);
    }
    // Only run once on mount using the initial query param.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDownload() {
    setFlow("processing");
    setProgress(0);
    try {
      const downloadResult = await downloadVideo({ url, formatId, qualityId }, setProgress);
      setResult(downloadResult);
      setFlow("success");
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : "Something went wrong.");
      setFlow("error");
    }
  }

  async function handleSaveToDevice() {
    if (!result) return;
    try {
      await triggerBrowserDownload(result.downloadUrl, result.filename);
    } catch {
      window.open(result.downloadUrl, "_blank");
    }
  }

  const selectedQuality = video?.qualities.find((q) => q.id === qualityId) ?? video?.qualities[0];

  return (
    <div className="flex w-full flex-col px-margin pb-space-xl md:mx-auto md:max-w-workspace md:px-gutter-desktop">
      <div className="relative mb-space-lg w-full overflow-hidden rounded-xl bg-surface-container-low p-space-md shadow-sm">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary-container/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-secondary-container/15 blur-2xl" />
        <div className="relative z-10 flex flex-col gap-space-2xs">
          <div className="flex items-center gap-space-xs">
            <span
              className="material-symbols-outlined text-[20px] text-primary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              download
            </span>
            <span className="font-label-code-sm text-label-code-sm uppercase tracking-wider text-primary">
              Engine Pipeline
            </span>
          </div>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile font-semibold tracking-tight text-on-surface">
            Video Downloader
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Paste a supported video URL and choose the format and quality you need.
          </p>
        </div>
      </div>

      <div className="mb-space-lg flex flex-col gap-space-md rounded-xl bg-surface-container-low p-space-md shadow-md">
        <div className="flex items-center justify-between">
          <label
            htmlFor="url-input"
            className="flex items-center gap-space-xs font-headline-sm text-headline-sm font-medium text-on-surface"
          >
            <span>Video URL</span>
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-tertiary" />
          </label>
          <span className="font-label-code-sm text-label-code-sm text-on-surface-variant">
            Direct / Multi-Host
          </span>
        </div>
        <URLInput
          id="url-input"
          value={url}
          onChange={setUrl}
          onSubmit={() => runAnalyze(url)}
          placeholder="Paste link here..."
        />
        <button
          type="button"
          onClick={() => runAnalyze(url)}
          disabled={!looksLikeUrl(url)}
          className="flex min-h-[44px] w-full items-center justify-center gap-space-xs rounded-lg bg-primary-container font-headline-sm text-body-md font-medium text-on-primary-container shadow-md transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[20px]">auto_detect_voice</span>
          <span>Analyze Video</span>
        </button>
        <div className="flex items-start gap-space-xs text-on-surface-variant">
          <span className="material-symbols-outlined mt-0.5 text-[16px] text-outline">
            verified_user
          </span>
          <p className="font-body-sm text-body-sm text-outline">
            Supported content only. Respect content copyright guidelines and fair use standards.
          </p>
        </div>
      </div>

      {flow === "analyzing" && (
        <LoadingState
          title="Probing Media Source..."
          description="Resolving host manifest, extracting adaptive audio/video tracks and DRM compliance signatures."
          logLines={["GET /manifest.mpd — 200 OK", "Parsing DASH stream indexes..."]}
        />
      )}

      {flow === "error" && (
        <ErrorState
          title="Unable to Process Link"
          description={errorMessage}
          errorCode="ERR_MANIFEST_UNAVAILABLE"
          responseDetail="HTTP 403 Forbidden / Origin Restricted"
          onRetry={() => runAnalyze(url)}
          onDismiss={() => setFlow(video ? "ready" : "idle")}
        />
      )}

      {flow === "ready" && video && (
        <div className="flex flex-col gap-space-md">
          <div className="flex flex-col overflow-hidden rounded-xl bg-surface-container shadow-lg">
            <MediaPreview
              thumbnailUrl={video.thumbnailUrl}
              title={video.title}
              host={video.host}
              durationLabel={video.durationLabel}
              fps={video.fps}
              alt={video.title}
            />
            <div className="flex flex-col gap-space-md p-space-md">
              <div>
                <div className="mb-space-2xs flex items-center gap-space-xs">
                  <span className="font-label-code-sm text-label-code-sm uppercase tracking-wider text-secondary">
                    Video Stream Verified
                  </span>
                  {video.hdr && (
                    <>
                      <span className="text-body-sm text-outline">•</span>
                      <span className="font-label-code-sm text-label-code-sm text-outline">
                        HDR10
                      </span>
                    </>
                  )}
                </div>
                <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                  {video.title}
                </h2>
              </div>

              <div className="flex flex-col gap-space-xs">
                <label className="font-label-code-sm text-label-code-sm uppercase tracking-wider text-on-surface-variant">
                  Choose Format
                </label>
                <FormatSelector
                  options={video.formats}
                  value={formatId}
                  onChange={setFormatId}
                  columns={2}
                  activeTextClassName="text-on-surface"
                  dotClassName="bg-primary"
                  label="Choose format"
                />
              </div>

              <div className="flex flex-col gap-space-xs">
                <div className="flex items-center justify-between">
                  <label className="font-label-code-sm text-label-code-sm uppercase tracking-wider text-on-surface-variant">
                    Choose Quality
                  </label>
                  <span className="font-label-code-sm text-label-code-sm text-primary">
                    Approx. {selectedQuality?.sizeEstimate.replace("~", "")}
                  </span>
                </div>
                <QualitySelector
                  options={video.qualities}
                  value={qualityId}
                  onChange={setQualityId}
                />
              </div>

              <button
                type="button"
                onClick={handleDownload}
                className="mt-space-xs flex min-h-[48px] w-full items-center justify-center gap-space-sm rounded-lg bg-primary-container font-headline-sm text-body-md font-semibold text-on-primary-container shadow-md transition-transform active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-[22px]">download_for_offline</span>
                <span>Download Video ({selectedQuality?.label})</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-space-xs rounded-xl bg-surface-container-low p-space-sm shadow-sm">
            <div className="flex flex-col items-center p-space-xs text-center">
              <span className="font-label-code-sm text-label-code-sm text-outline">Bitrate</span>
              <span className="mt-0.5 font-label-code-lg text-label-code-lg font-semibold text-on-surface">
                {video.bitrate}
              </span>
            </div>
            <div className="flex flex-col items-center p-space-xs text-center">
              <span className="font-label-code-sm text-label-code-sm text-outline">Audio</span>
              <span className="mt-0.5 font-label-code-lg text-label-code-lg font-semibold text-on-surface">
                {video.audioCodec}
              </span>
            </div>
            <div className="flex flex-col items-center p-space-xs text-center">
              <span className="font-label-code-sm text-label-code-sm text-outline">Codec</span>
              <span className="mt-0.5 font-label-code-lg text-label-code-lg font-semibold text-on-surface">
                {video.videoCodec}
              </span>
            </div>
          </div>
        </div>
      )}

      {flow === "processing" && (
        <div className="flex flex-col gap-space-md rounded-xl bg-surface-container p-space-md shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-space-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container-highest text-primary">
                <span className="material-symbols-outlined animate-bounce text-[24px]">
                  downloading
                </span>
              </div>
              <div>
                <h3 className="font-headline-sm text-body-md font-semibold text-on-surface">
                  Preparing Download...
                </h3>
                <p className="font-label-code-sm text-label-code-sm text-on-surface-variant">
                  Multiplexing video and audio streams
                </p>
              </div>
            </div>
            <span className="font-label-code-lg text-label-code-lg font-semibold text-primary">
              {progress}%
            </span>
          </div>
          <div className="flex flex-col gap-space-xs">
            <ProgressBar percent={progress} label="Download progress" />
            <div className="flex items-center justify-between font-label-code-sm text-label-code-sm text-outline">
              <span>
                {((progress / 100) * 142.6).toFixed(1)} MB of 142.6 MB
              </span>
              <span className="text-tertiary">~12.4 MB/s</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-space-xs rounded-lg bg-surface-container-lowest p-space-sm font-label-code-sm text-label-code-sm">
            <div>
              <span className="text-outline">Remaining Time:</span>
              <span className="ml-1 font-medium text-on-surface">
                {Math.max(0, Math.round((100 - progress) / 15))}s
              </span>
            </div>
            <div>
              <span className="text-outline">Threads:</span>
              <span className="ml-1 font-medium text-on-surface">8 parallel</span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-space-xs">
            <button
              type="button"
              onClick={() => setFlow("ready")}
              className="min-h-[44px] rounded-lg px-space-md font-label-code-sm text-label-code-sm text-error transition-colors hover:bg-error-container/10"
            >
              Cancel Download
            </button>
          </div>
        </div>
      )}

      {flow === "success" && result && (
        <SuccessState
          title="Your Video is Ready"
          description="Media multiplexing complete. File has been optimized for playback on all devices."
          onReset={() => {
            setFlow("ready");
            setResult(null);
          }}
          resetLabel="Download Another Video"
          downloadSlot={
            <DownloadButton label="Download File to Device" onClick={handleSaveToDevice} />
          }
        >
          <div className="my-space-md flex w-full items-center justify-between rounded-lg bg-surface-container-low p-space-sm text-left">
            <div className="flex items-center gap-space-sm truncate pr-space-xs">
              <span className="material-symbols-outlined text-[26px] text-secondary">movie</span>
              <div className="truncate">
                <p className="truncate font-label-code-sm text-label-code-sm font-medium text-on-surface">
                  {result.filename}
                </p>
                <p className="font-label-code-sm text-label-code-sm text-outline">
                  {result.sizeLabel} • {result.formatLabel} • {result.qualityLabel}
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined flex-shrink-0 text-[20px] text-tertiary">
              task_alt
            </span>
          </div>
        </SuccessState>
      )}

      <div className="mt-space-lg flex flex-col gap-space-sm">
        <div className="flex items-center justify-between">
          <span className="font-label-code-sm text-label-code-sm uppercase tracking-wider text-outline">
            Engine Capabilities
          </span>
          <span className="font-label-code-sm text-label-code-sm text-secondary">
            Zero Compression Loss
          </span>
        </div>
        <div className="grid grid-cols-1 gap-space-sm sm:grid-cols-2">
          {ENGINE_CAPABILITIES.map((capability) => (
            <div
              key={capability.title}
              className="flex flex-col gap-space-xs rounded-xl bg-surface-container-low p-space-sm shadow-sm"
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded bg-surface-container-highest ${capability.accent}`}
              >
                <span className="material-symbols-outlined text-[18px]">{capability.icon}</span>
              </div>
              <span className="font-headline-sm text-body-md font-medium text-on-surface">
                {capability.title}
              </span>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {capability.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function VideoDownloaderPage() {
  return (
    <Suspense fallback={null}>
      <VideoDownloaderContent />
    </Suspense>
  );
}
