"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface WaveformProps {
  /** 0–1 scrub position. */
  progress: number;
  onScrub?: (progress: number) => void;
  barCount?: number;
  seed?: number;
  animated?: boolean;
}

/** Deterministic pseudo-random bar heights so the waveform looks organic but stable. */
function generateBarHeights(count: number, seed: number): number[] {
  const heights: number[] = [];
  let value = seed;
  for (let i = 0; i < count; i += 1) {
    value = (value * 9301 + 49297) % 233280;
    const rand = value / 233280;
    heights.push(4 + Math.round(rand * 14));
  }
  return heights;
}

/** Reactive audio waveform used by the Video to Audio tool's studio card. */
export function Waveform({
  progress,
  onScrub,
  barCount = 40,
  seed = 42,
  animated = false,
}: WaveformProps) {
  const heights = useMemo(() => generateBarHeights(barCount, seed), [barCount, seed]);
  const activeIndex = Math.round(progress * barCount);

  function handleClick(index: number) {
    onScrub?.(index / barCount);
  }

  return (
    <div className="flex h-20 w-full select-none items-center justify-between gap-[2px] py-space-xs">
      {heights.map((height, index) => {
        const isPlayed = index <= activeIndex;
        return (
          <button
            key={index}
            type="button"
            aria-label={`Scrub to ${Math.round((index / barCount) * 100)}%`}
            onClick={() => handleClick(index)}
            className={cn(
              "w-1 flex-1 rounded-full transition-colors",
              isPlayed ? "bg-secondary" : "bg-surface-variant",
              animated && "animate-pulse",
            )}
            style={{ height: `${height * 4}px` }}
          />
        );
      })}
    </div>
  );
}
