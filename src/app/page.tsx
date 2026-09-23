"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FAQAccordion } from "@/components/ui/FAQAccordion";
import { ToolCard } from "@/components/ui/ToolCard";
import { URLInput } from "@/components/ui/URLInput";
import { HOME_FAQ } from "@/lib/constants";
import { checkHealth } from "@/lib/api";
import type { HealthStatus } from "@/lib/types";
import { looksLikeUrl } from "@/lib/utils";

const PIPELINE_ROWS = [
  {
    icon: "videocam",
    iconColor: "text-secondary",
    label: "Source Video",
    chips: [
      { text: "MP4 4K", tone: "neutral" as const },
      { text: "WEBM", tone: "tertiary" as const },
    ],
  },
  {
    icon: "graphic_eq",
    iconColor: "text-tertiary",
    label: "Stream Extract",
    chips: [
      { text: "MP3 320k", tone: "primary" as const },
      { text: "WAV", tone: "neutral" as const },
    ],
  },
  {
    icon: "auto_awesome",
    iconColor: "text-primary",
    label: "Image Raster",
    chips: [
      { text: "JPG", tone: "neutral" as const },
      { text: "WEBP", tone: "secondary" as const },
    ],
  },
];

const HOW_IT_WORKS = [
  {
    number: "01",
    title: "Paste",
    icon: "content_paste",
    accent: "text-primary",
    description: "Paste your video URL or upload an image.",
  },
  {
    number: "02",
    title: "Customize",
    icon: "tune",
    accent: "text-secondary",
    description: "Choose your format, quality and available options.",
  },
  {
    number: "03",
    title: "Download",
    icon: "download_done",
    accent: "text-tertiary",
    description: "Download your processed file.",
  },
];

const WHY_ACTIONX = [
  {
    icon: "touch_app",
    accent: "text-primary",
    title: "Simple Interface",
    description: "Easy-to-understand tools without unnecessary complexity.",
  },
  {
    icon: "speed",
    accent: "text-tertiary",
    title: "Fast Workflow",
    description: "Designed for a smooth and efficient experience.",
  },
  {
    icon: "hub",
    accent: "text-secondary",
    title: "Multiple Formats",
    description: "Work with popular video, audio and image formats.",
  },
  {
    icon: "cleaning_services",
    accent: "text-primary-fixed-dim",
    title: "Clean Experience",
    description: "A focused interface without unnecessary clutter.",
  },
];

const SUPPORTED_FORMATS = [
  { label: "Video Standards", formats: ["MP4", "WebM"] },
  { label: "Audio Codecs", formats: ["MP3", "M4A", "WAV"] },
  { label: "Image Encoders", formats: ["JPG", "PNG", "WEBP", "GIF", "BMP", "TIFF"] },
];

export default function HomePage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [hint, setHint] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function runCheck() {
      const status = await checkHealth();
      if (!cancelled) setHealth(status);
    }

    void runCheck();
    const interval = setInterval(runCheck, 20_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  function handleAnalyze() {
    if (!looksLikeUrl(url)) {
      setHint("Please enter a valid link first...");
      return;
    }
    router.push(`/video-downloader?url=${encodeURIComponent(url)}`);
  }

  return (
    <div className="flex w-full flex-col gap-space-xl px-margin md:mx-auto md:max-w-workspace md:px-gutter-desktop">
      {/* HERO */}
      <section className="flex flex-col gap-space-lg pt-space-lg">
        <div className="flex items-center gap-space-xs self-start rounded-full bg-surface-container-high px-space-md py-space-2xs shadow-sm">
          <span
            className={`h-2 w-2 rounded-full ${
              health === null
                ? "animate-pulse bg-outline"
                : health.online
                  ? "animate-pulse bg-tertiary"
                  : "bg-error"
            }`}
          />
          <span
            className={`font-label-code-sm text-label-code-sm ${
              health === null ? "text-outline" : health.online ? "text-primary" : "text-error"
            }`}
          >
            ENGINE STATUS: {health === null ? "CHECKING..." : health.online ? "ONLINE" : "OFFLINE"}
            {health?.version ? ` (V${health.version})` : ""}
          </span>
        </div>

        <div className="flex flex-col gap-space-xs">
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile font-semibold tracking-tight text-on-surface md:font-headline-lg md:text-headline-lg">
            Download. Convert. <span className="text-primary-fixed-dim">Simplify.</span>
          </h1>
          <p className="max-w-xl font-body-md text-body-md text-on-surface-variant md:text-body-lg">
            Powerful tools for your everyday media tasks — all in one place.
          </p>
        </div>

        <div className="flex flex-col gap-space-md rounded-xl bg-surface-container p-space-md shadow-xl md:max-w-xl">
          <div className="flex items-center justify-between">
            <label
              htmlFor="hero-url-input"
              className="font-label-code-sm text-label-code-sm uppercase tracking-wider text-outline"
            >
              Paste a supported video URL
            </label>
            <div className="flex items-center gap-space-2xs text-tertiary">
              <span className="material-symbols-outlined text-[14px]">bolt</span>
              <span className="font-label-metric text-label-metric uppercase">Auto-Detect</span>
            </div>
          </div>
          <div className="flex flex-col gap-space-xs">
            <URLInput
              id="hero-url-input"
              value={url}
              onChange={(value) => {
                setUrl(value);
                setHint(null);
              }}
              onSubmit={handleAnalyze}
              placeholder={hint ?? "Paste your video link here..."}
            />
          </div>
          <button
            type="button"
            onClick={handleAnalyze}
            className="flex min-h-[44px] w-full items-center justify-center gap-space-xs rounded-lg bg-primary-container font-headline-sm text-body-md font-semibold text-on-primary-container shadow-md transition-all active:scale-[0.99]"
          >
            <span className="material-symbols-outlined text-[18px]">search_check</span>
            <span>Analyze</span>
          </button>
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined flex-shrink-0 text-[16px] text-outline">
              shield
            </span>
            <p className="font-body-sm text-body-sm text-outline">
              Use content you have permission to download or process.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-space-sm rounded-xl bg-surface-container-low p-space-md shadow-md md:max-w-xl">
          <div className="flex items-center justify-between">
            <span className="font-label-code-sm text-label-code-sm uppercase tracking-wider text-outline">
              Universal Pipeline Matrix
            </span>
            <span
              className={`rounded bg-surface-container-highest px-space-xs py-space-2xs font-label-metric text-label-metric ${
                health?.online ? "text-primary-fixed-dim" : "text-outline"
              }`}
            >
              {health?.online && health.latencyMs !== undefined ? `${health.latencyMs}ms LATENCY` : "-- LATENCY"}
            </span>
          </div>
          {PIPELINE_ROWS.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between rounded-lg bg-surface-container p-space-xs"
            >
              <div className="flex items-center gap-space-xs">
                <span className={`material-symbols-outlined text-[18px] ${row.iconColor}`}>
                  {row.icon}
                </span>
                <span className="font-body-sm text-body-sm font-medium">{row.label}</span>
              </div>
              <span className="material-symbols-outlined text-[16px] text-outline-variant">
                east
              </span>
              <div className="flex items-center gap-space-xs">
                {row.chips.map((chip) => (
                  <span
                    key={chip.text}
                    className={`rounded px-space-xs py-space-2xs font-label-code-sm text-label-code-sm ${
                      chip.tone === "primary"
                        ? "bg-primary-container text-on-primary-container"
                        : chip.tone === "secondary"
                          ? "bg-surface-variant text-secondary"
                          : chip.tone === "tertiary"
                            ? "bg-surface-variant text-tertiary"
                            : "bg-surface-variant text-on-surface"
                    }`}
                  >
                    {chip.text}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED TOOLS */}
      <section className="flex flex-col gap-space-lg">
        <div className="flex flex-col gap-space-2xs">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-[20px] text-primary">tune</span>
            <span className="font-label-code-sm text-label-code-sm uppercase tracking-wider text-outline">
              Media Suite
            </span>
          </div>
          <h2 className="font-headline-md text-headline-md font-semibold tracking-tight text-on-surface">
            Everything you need
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Simple tools for downloading and converting your media.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-space-lg md:grid-cols-3">
          <ToolCard
            icon="download"
            iconColorClassName="text-primary"
            title="Video Downloader"
            description="Download supported online videos in the available formats and qualities."
            ctaLabel="Download Videos"
            href="/video-downloader"
            visual={
              <div className="relative h-44 w-full overflow-hidden rounded-lg bg-surface-container-lowest">
                <Image
                  src="https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=800&auto=format&fit=crop"
                  alt="Cinematic video preview frame"
                  fill
                  sizes="(min-width: 768px) 400px, 100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 flex flex-col justify-between bg-surface/40 p-space-sm backdrop-blur-[1px]">
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-surface/80 px-space-xs py-space-2xs font-label-code-sm text-label-code-sm text-primary backdrop-blur">
                      HQ STREAM
                    </span>
                    <div className="flex gap-space-2xs">
                      <span className="rounded bg-primary-container px-space-xs py-space-2xs font-label-metric text-label-metric text-on-primary-container">
                        1080p
                      </span>
                      <span className="rounded bg-surface-bright px-space-xs py-space-2xs font-label-metric text-label-metric text-on-surface">
                        4K HDR
                      </span>
                    </div>
                  </div>
                  <div className="flex h-12 w-12 self-center items-center justify-center rounded-full bg-primary-container/90 text-on-primary shadow-lg">
                    <span
                      className="material-symbols-outlined text-[28px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      play_arrow
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-label-code-sm text-label-code-sm text-on-surface">
                    <span>03:42 / 1080p60</span>
                    <span className="text-tertiary">38.4 MB</span>
                  </div>
                </div>
              </div>
            }
          />

          <ToolCard
            icon="graphic_eq"
            iconColorClassName="text-tertiary"
            title="Video to Audio"
            description="Extract audio from supported videos and save it in your preferred format."
            ctaLabel="Convert to Audio"
            href="/video-to-audio"
            visual={
              <div className="flex w-full flex-col gap-space-sm rounded-lg bg-surface-container-lowest p-space-md shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]">
                <div className="flex items-center justify-between">
                  <span className="font-label-code-sm text-label-code-sm text-secondary">
                    SPECTRUM RENDER
                  </span>
                  <span className="font-label-metric text-label-metric text-on-surface-variant">
                    48,000 HZ / STEREO
                  </span>
                </div>
                <div className="flex h-12 w-full items-end gap-[3px]">
                  {[8, 16, 28, 36, 44, 32, 20, 12, 24, 40, 28, 20, 32, 44, 36, 24, 12, 28, 40, 32].map(
                    (h, i) => (
                      <span
                        key={i}
                        className="w-1 flex-1 rounded-sm bg-primary"
                        style={{ height: `${h}px`, opacity: 0.3 + (h / 44) * 0.7 }}
                      />
                    ),
                  )}
                </div>
                <div className="flex items-center justify-between pt-space-xs">
                  <div className="flex items-center gap-space-2xs">
                    <span className="rounded bg-surface-container px-space-xs py-space-2xs font-label-code-sm text-label-code-sm text-primary">
                      320 kbps MP3
                    </span>
                    <span className="rounded bg-surface-container px-space-xs py-space-2xs font-label-code-sm text-label-code-sm text-outline">
                      FLAC 24-bit
                    </span>
                  </div>
                  <span className="font-label-code-sm text-label-code-sm text-tertiary">
                    Lossless Passthrough
                  </span>
                </div>
              </div>
            }
          />

          <ToolCard
            icon="auto_awesome"
            iconColorClassName="text-secondary"
            title="Image Converter"
            description="Convert your images between popular formats with simple controls."
            ctaLabel="Convert Images"
            href="/image-converter"
            visual={
              <div className="flex w-full flex-col gap-space-md rounded-lg bg-surface-container-lowest p-space-md shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col items-center">
                    <span className="rounded bg-surface-variant px-space-sm py-space-2xs font-label-code-sm text-label-code-sm text-on-surface">
                      JPG
                    </span>
                    <span className="mt-space-2xs font-label-metric text-label-metric text-outline">
                      2.4 MB
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-[18px] text-outline-variant">
                    trending_flat
                  </span>
                  <div className="flex flex-col items-center">
                    <span className="rounded bg-surface-variant px-space-sm py-space-2xs font-label-code-sm text-label-code-sm text-on-surface">
                      PNG
                    </span>
                    <span className="mt-space-2xs font-label-metric text-label-metric text-outline">
                      Alpha
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-[18px] text-primary">
                    trending_flat
                  </span>
                  <div className="flex flex-col items-center">
                    <span className="rounded bg-primary-container px-space-sm py-space-2xs font-label-code-sm text-label-code-sm font-semibold text-on-primary-container">
                      WEBP
                    </span>
                    <span className="mt-space-2xs font-label-metric text-label-metric text-tertiary">
                      -78% Size
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-space-xs">
                  <div className="flex items-center justify-between font-label-code-sm text-label-code-sm">
                    <span className="text-outline">Compression Balance</span>
                    <span className="font-medium text-primary">92% Quality</span>
                  </div>
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
                    <div className="absolute inset-y-0 left-0 w-[92%] rounded-full bg-gradient-to-r from-primary to-tertiary" />
                  </div>
                </div>
              </div>
            }
          />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="flex scroll-mt-24 flex-col gap-space-lg">
        <div className="flex flex-col gap-space-2xs">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-[20px] text-tertiary">schema</span>
            <span className="font-label-code-sm text-label-code-sm uppercase tracking-wider text-outline">
              Workflow
            </span>
          </div>
          <h2 className="font-headline-md text-headline-md font-semibold tracking-tight text-on-surface">
            How it works
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Engineered for rapid transformation in three fluid stages.
          </p>
        </div>
        <div className="flex flex-col gap-space-sm md:flex-row">
          {HOW_IT_WORKS.map((step) => (
            <div
              key={step.number}
              className="flex flex-1 items-start gap-space-md rounded-xl bg-surface-container p-space-md shadow-sm"
            >
              <div
                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-surface-container-high font-label-code-lg text-label-code-lg font-bold ${step.accent}`}
              >
                {step.number}
              </div>
              <div className="flex min-w-0 flex-col gap-space-2xs">
                <div className="flex items-center gap-space-xs">
                  <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                    {step.title}
                  </h3>
                  <span className="material-symbols-outlined text-[16px] text-outline">
                    {step.icon}
                  </span>
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* WHY ACTIONX */}
      <section className="flex flex-col gap-space-lg">
        <div className="flex flex-col gap-space-2xs">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-[20px] text-primary">verified</span>
            <span className="font-label-code-sm text-label-code-sm uppercase tracking-wider text-outline">
              Utility Philosophy
            </span>
          </div>
          <h2 className="font-headline-md text-headline-md font-semibold tracking-tight text-on-surface">
            Why ActionX
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Focused execution without artificial barriers or complexity.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-space-sm md:grid-cols-2 lg:grid-cols-4">
          {WHY_ACTIONX.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col gap-space-xs rounded-xl bg-surface-container-low p-space-md"
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg bg-surface-container-high ${feature.accent}`}
              >
                <span className="material-symbols-outlined text-[20px]">{feature.icon}</span>
              </div>
              <h3 className="mt-space-2xs font-headline-sm text-headline-sm font-semibold text-on-surface">
                {feature.title}
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* SUPPORTED FORMATS */}
      <section className="flex flex-col gap-space-md rounded-xl bg-surface-container p-space-lg shadow-sm">
        <div className="flex flex-col gap-space-2xs">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-[20px] text-primary">category</span>
            <span className="font-label-code-sm text-label-code-sm uppercase tracking-wider text-outline">
              Supported Formats
            </span>
          </div>
          <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
            Comprehensive standard encoding support
          </h3>
        </div>
        {SUPPORTED_FORMATS.map((group) => (
          <div key={group.label} className="flex flex-col gap-space-xs">
            <span className="font-label-metric text-label-metric uppercase text-outline">
              {group.label}
            </span>
            <div className="flex flex-wrap gap-space-xs">
              {group.formats.map((format) => (
                <span
                  key={format}
                  className="rounded-lg bg-surface-variant px-space-sm py-space-xs font-label-code-sm text-label-code-sm font-medium text-on-surface"
                >
                  {format}
                </span>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* FAQ */}
      <section id="faq" className="flex scroll-mt-24 flex-col gap-space-lg pb-space-xl">
        <div className="flex flex-col gap-space-2xs">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-[20px] text-primary">
              help_center
            </span>
            <span className="font-label-code-sm text-label-code-sm uppercase tracking-wider text-outline">
              Knowledge Base
            </span>
          </div>
          <h2 className="font-headline-md text-headline-md font-semibold tracking-tight text-on-surface">
            Frequently Asked Questions
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Clear, practical answers about the engine architecture.
          </p>
        </div>
        <FAQAccordion items={HOME_FAQ} />
      </section>
    </div>
  );
}
