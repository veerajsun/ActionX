"use client";

import Image from "next/image";
import { useState } from "react";
import { URLInput } from "@/components/ui/URLInput";
import { FormatSelector } from "@/components/ui/FormatSelector";
import { AudioQualitySelector } from "@/components/ui/AudioQualitySelector";
import { Waveform } from "@/components/ui/Waveform";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SuccessState } from "@/components/ui/SuccessState";
import { DownloadButton } from "@/components/ui/DownloadButton";
import { AUDIO_FORMATS, AUDIO_QUALITIES } from "@/lib/constants";
import { analyzeAudio, convertAudio, ApiError } from "@/lib/api";
import type { AnalyzedAudioSource, AudioResult, FlowState } from "@/lib/types";
import { looksLikeUrl, triggerBrowserDownload } from "@/lib/utils";

export default function VideoToAudioPage() {
  const [url, setUrl] = useState("");
  const [flow, setFlow] = useState<FlowState>("idle");
  const [source, setSource] = useState<AnalyzedAudioSource | null>(null);
  const [formatId, setFormatId] = useState<string>("MP3");
  const [qualityId, setQualityId] = useState("320");
  const [normalize, setNormalize] = useState(true);
  const [scrub, setScrub] = useState(0.26);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<AudioResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  async function runAnalyze() {
    if (!looksLikeUrl(url)) return;
    setFlow("analyzing");
    try {
      const analyzed = await analyzeAudio(url);
      setSource(analyzed);
      setFlow("ready");
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : "Something went wrong.");
      setFlow("error");
    }
  }

  async function handleConvert() {
    if (!source) return;
    setFlow("processing");
    setProgress(0);
    try {
      const audioResult = await convertAudio(
        { url, formatId, qualityId, normalize },
        setProgress,
      );
      setResult(audioResult);
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

  const selectedQuality = AUDIO_QUALITIES.find((q) => q.id === qualityId) ?? AUDIO_QUALITIES[3];
  const estimatedMb = ((selectedQuality.kbps / 8) * (765 / 1000)).toFixed(1);

  return (
    <div className="flex w-full flex-col gap-space-lg px-margin pb-space-xl md:mx-auto md:max-w-workspace md:px-gutter-desktop">
      <div className="mt-space-xs flex flex-col gap-space-2xs">
        <div className="flex items-center gap-space-xs">
          <span className="h-2 w-2 animate-pulse rounded-full bg-secondary" />
          <span className="font-label-code-sm text-label-code-sm uppercase tracking-widest text-secondary">
            Audio Engineering Deck
          </span>
        </div>
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile font-semibold text-on-surface">
          Video to Audio
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Extract audio from supported video sources and choose your preferred format.
        </p>
      </div>

      <div className="flex w-full flex-col gap-space-xs rounded-xl bg-surface-container p-space-sm shadow-md">
        <div className="flex items-center rounded-lg bg-surface-container-lowest px-space-sm py-space-2xs">
          <span className="material-symbols-outlined mr-space-xs text-[20px] text-outline">
            link
          </span>
          <input
            id="audio-url-input"
            type="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && runAnalyze()}
            placeholder="Paste your video link here..."
            className="min-w-0 w-full bg-transparent font-label-code-lg text-label-code-lg text-on-surface placeholder:text-outline focus:outline-none"
          />
          <button
            type="button"
            onClick={runAnalyze}
            disabled={!looksLikeUrl(url)}
            className="flex min-h-[38px] flex-shrink-0 items-center gap-space-2xs rounded bg-primary-container px-space-md py-space-xs font-headline-sm text-body-sm font-medium text-on-primary-container shadow-sm transition-all hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">search</span>
            <span>Analyze</span>
          </button>
        </div>
        <div className="flex items-center justify-between px-space-2xs pt-space-2xs text-outline">
          <span className="flex items-center gap-space-2xs font-label-code-sm text-label-code-sm">
            <span className="material-symbols-outlined text-[14px] text-tertiary">
              check_circle
            </span>
            YouTube, Vimeo, Twitch, Direct MP4
          </span>
          <span className="font-label-code-sm text-label-code-sm">DSP v4.1</span>
        </div>
      </div>

      {flow === "analyzing" && (
        <LoadingState
          title="Inspecting Audio Stream..."
          description="Resolving host manifest and extracting the highest fidelity audio track available."
        />
      )}

      {flow === "error" && (
        <ErrorState
          title="Unable to Process Link"
          description={errorMessage}
          errorCode="ERR_STREAM_UNAVAILABLE"
          responseDetail="HTTP 403 Forbidden / Origin Restricted"
          onRetry={runAnalyze}
          onDismiss={() => setFlow(source ? "ready" : "idle")}
        />
      )}

      {source && (flow === "ready" || flow === "processing" || flow === "success") && (
        <div className="relative flex w-full flex-col gap-space-md overflow-hidden rounded-xl bg-surface-container p-space-md shadow-md">
          <div className="pointer-events-none absolute -top-12 right-0 h-44 w-44 rounded-full bg-secondary/10 blur-3xl" />
          <div className="flex items-center gap-space-md">
            <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-surface-container-lowest shadow-sm">
              <Image
                src={source.thumbnailUrl}
                alt={source.title}
                fill
                sizes="80px"
                className="object-cover"
              />
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-surface-container-lowest/90 via-transparent to-transparent p-space-2xs">
                <span className="rounded bg-surface-container-lowest/90 px-space-2xs py-[1px] font-label-code-sm text-label-code-sm text-secondary">
                  {source.durationLabel}
                </span>
              </div>
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-center gap-space-xs">
                <span className="rounded bg-surface-container-highest px-space-xs py-[2px] font-label-code-sm text-label-code-sm text-secondary">
                  {source.host.toUpperCase()}
                </span>
                <span className="flex items-center gap-[2px] font-label-code-sm text-label-code-sm text-tertiary">
                  <span className="h-1.5 w-1.5 rounded-full bg-tertiary" /> {source.sampleRateLabel}
                </span>
              </div>
              <h2 className="mt-space-2xs truncate font-headline-sm text-headline-sm text-on-surface">
                {source.title} ({source.durationLabel})
              </h2>
              <p className="truncate font-body-sm text-body-sm text-on-surface-variant">
                {source.subtitle}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-space-xs rounded-lg bg-surface-container-lowest p-space-sm shadow-sm">
            <div className="flex items-center justify-between font-label-code-sm text-label-code-sm">
              <div className="flex items-center gap-space-2xs text-secondary">
                <span className="material-symbols-outlined text-[16px]">graphic_eq</span>
                <span>WAVEFORM RENDER</span>
              </div>
              <span className="font-label-code-sm text-label-code-sm text-on-surface-variant">
                <strong className="font-medium text-secondary">
                  {Math.floor(scrub * 765 / 60)}:
                  {String(Math.floor((scrub * 765) % 60)).padStart(2, "0")}
                </strong>{" "}
                / {source.durationLabel}
              </span>
            </div>
            <Waveform
              progress={scrub}
              onScrub={setScrub}
              animated={flow === "processing"}
            />
            <div className="flex items-center justify-between pt-space-2xs font-label-metric text-label-metric uppercase tracking-wider text-outline">
              <span>00:00 [Intro]</span>
              <span>04:15 [Bridge]</span>
              <span>08:30 [Outro]</span>
              <span>{source.durationLabel}</span>
            </div>
          </div>
        </div>
      )}

      {source && flow === "ready" && (
        <div className="flex w-full flex-col gap-space-md rounded-xl bg-surface-container p-space-md shadow-md">
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center justify-between">
              <label className="font-label-code-sm text-label-code-sm uppercase tracking-wider text-on-surface-variant">
                1. Output Format
              </label>
              <span className="font-label-code-sm text-label-code-sm text-secondary">
                Universal Codec
              </span>
            </div>
            <FormatSelector
              options={AUDIO_FORMATS}
              value={formatId}
              onChange={setFormatId}
              columns={3}
              activeTextClassName="text-secondary"
              dotClassName="bg-secondary"
              label="Output format"
            />
          </div>

          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center justify-between">
              <label className="font-label-code-sm text-label-code-sm uppercase tracking-wider text-on-surface-variant">
                2. Audio Bitrate / Quality
              </label>
              <span className="rounded bg-tertiary-container px-space-xs py-[1px] font-label-code-sm text-label-code-sm text-on-tertiary-container">
                Studio Quality (~{estimatedMb} MB)
              </span>
            </div>
            <AudioQualitySelector
              options={AUDIO_QUALITIES}
              value={qualityId}
              onChange={setQualityId}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg bg-surface-container-lowest p-space-sm">
            <div className="flex min-w-0 items-center gap-space-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-container-high text-secondary">
                <span className="material-symbols-outlined text-[20px]">equalizer</span>
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="font-headline-sm text-body-md font-medium text-on-surface">
                  Normalize Audio Levels
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  EBU R128 loudness correction target -14 LUFS
                </span>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={normalize}
              aria-label="Toggle audio normalization"
              onClick={() => setNormalize((value) => !value)}
              className={`relative h-7 w-12 flex-shrink-0 rounded-full shadow-sm transition-colors ${
                normalize ? "bg-primary-container" : "bg-surface-container-high"
              }`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-on-primary-container transition-transform ${
                  normalize ? "right-1" : "left-1"
                }`}
              />
            </button>
          </div>

          <button
            type="button"
            onClick={handleConvert}
            className="flex min-h-[52px] w-full items-center justify-center gap-space-sm rounded-lg bg-primary-container font-headline-sm text-headline-sm font-semibold text-on-primary-container shadow-xl transition-all active:scale-[0.99] hover:bg-primary-container/90"
          >
            <span className="material-symbols-outlined text-[24px]">graphic_eq</span>
            <span>Convert to Audio</span>
          </button>
        </div>
      )}

      {flow === "processing" && (
        <div className="flex w-full flex-col gap-space-sm rounded-xl bg-surface-container p-space-md shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-space-xs">
              <span className="h-2.5 w-2.5 animate-ping rounded-full bg-secondary" />
              <span className="font-headline-sm text-headline-sm font-medium text-on-surface">
                Extracting audio...
              </span>
            </div>
            <span className="rounded bg-surface-container-lowest px-space-xs py-[2px] font-label-code-sm text-label-code-sm text-secondary">
              FFmpeg DSP Active
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Transcoding stream to {selectedQuality.kbps}kbps {formatId}
            {normalize ? " (EBU R128 loudness normalizer enabled)" : ""}...
          </p>
          <div className="flex h-10 w-full items-end justify-between gap-[3px] overflow-hidden rounded-lg bg-surface-container-lowest px-space-md py-space-2xs">
            {Array.from({ length: 18 }).map((_, i) => (
              <span
                key={i}
                className={`w-1 flex-1 animate-bounce rounded-full ${
                  i % 2 === 0 ? "bg-secondary" : "bg-primary-fixed-dim"
                }`}
                style={{ height: `${16 + ((i * 13) % 28)}px`, animationDelay: `${(i % 6) * 0.06}s` }}
              />
            ))}
          </div>
          <div className="mt-space-2xs flex flex-col gap-space-2xs">
            <ProgressBar percent={progress} label="Conversion progress" />
            <div className="flex items-center justify-between font-label-code-sm text-label-code-sm text-outline">
              <span>{progress}% completed</span>
              <span>Speed: 14.2x • ETA: {Math.max(0, Math.round((100 - progress) / 20))}s</span>
            </div>
          </div>
        </div>
      )}

      {flow === "success" && result && (
        <SuccessState
          title="Audio ready"
          badge="Bit-Perfect"
          description="Master output verified and tagged."
          onReset={() => {
            setFlow("ready");
            setResult(null);
          }}
          resetLabel="Convert Another"
          downloadSlot={<DownloadButton label="Download Audio" onClick={handleSaveToDevice} />}
        >
          <div className="flex w-full flex-col gap-space-xs rounded-lg bg-surface-container-lowest p-space-sm font-label-code-sm text-label-code-sm">
            <div className="flex items-center justify-between text-on-surface">
              <span className="text-outline">Filename</span>
              <span className="max-w-[200px] truncate font-medium text-secondary">
                {result.filename}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-space-xs pt-space-2xs">
              <div className="flex items-center justify-between rounded bg-surface-container-high px-space-xs py-space-2xs">
                <span className="text-outline">Format</span>
                <span className="text-on-surface">{result.formatLabel}</span>
              </div>
              <div className="flex items-center justify-between rounded bg-surface-container-high px-space-xs py-space-2xs">
                <span className="text-outline">Quality</span>
                <span className="text-on-surface">{result.qualityLabel}</span>
              </div>
              <div className="flex items-center justify-between rounded bg-surface-container-high px-space-xs py-space-2xs">
                <span className="text-outline">Duration</span>
                <span className="text-on-surface">{result.durationLabel}</span>
              </div>
              <div className="flex items-center justify-between rounded bg-surface-container-high px-space-xs py-space-2xs">
                <span className="text-outline">Size</span>
                <span className="font-semibold text-tertiary">{result.sizeLabel}</span>
              </div>
            </div>
          </div>
        </SuccessState>
      )}

      <div className="flex w-full flex-col gap-space-xs rounded-xl bg-surface-container-low p-space-md">
        <div className="flex items-center gap-space-xs text-outline">
          <span className="material-symbols-outlined text-[18px]">info</span>
          <span className="font-label-code-sm text-label-code-sm uppercase tracking-wider">
            Engine Information
          </span>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          ActionX uses high-fidelity multi-threaded decoding. Audio tags, cover art embedding, and
          ID3v2.4 metadata are automatically synthesized into your download.
        </p>
      </div>
    </div>
  );
}
