// Shared types for the ActionX frontend mock pipeline.
// These model the shapes a real backend would eventually return, so the
// UI components below can be rewired to live data without changing props.

export type NavPath =
  | "home"
  | "video-downloader"
  | "video-to-audio"
  | "image-converter"
  | "how-it-works"
  | "faq"
  | "privacy-policy";

export interface NavItem {
  label: string;
  path: NavPath;
  href: string;
  icon: string;
}

/** Generic async flow state shared by every tool page. */
export type FlowState =
  | "idle"
  | "analyzing"
  | "ready"
  | "processing"
  | "success"
  | "error";

export interface VideoFormatOption {
  id: string;
  label: string;
}

export interface VideoQualityOption {
  id: string;
  label: string;
  sizeEstimate: string;
  badge?: "HD" | "BEST";
}

export interface AnalyzedVideo {
  title: string;
  host: string;
  durationLabel: string;
  thumbnailUrl: string;
  fps: number;
  hdr: boolean;
  formats: VideoFormatOption[];
  qualities: VideoQualityOption[];
  bitrate: string;
  audioCodec: string;
  videoCodec: string;
}

export interface DownloadResult {
  filename: string;
  sizeLabel: string;
  formatLabel: string;
  qualityLabel: string;
  /** Absolute URL to GET /api/download/:fileId — triggers the actual file save. */
  downloadUrl: string;
}

export interface AudioFormatOption {
  id: "MP3" | "M4A" | "WAV";
  label: string;
  sublabel?: string;
}

export interface AudioQualityOption {
  id: string;
  kbps: number;
  isMax?: boolean;
}

export interface AnalyzedAudioSource {
  title: string;
  subtitle: string;
  host: string;
  durationLabel: string;
  durationSeconds: number;
  thumbnailUrl: string;
  sampleRateLabel: string;
}

export interface AudioResult {
  filename: string;
  formatLabel: string;
  qualityLabel: string;
  durationLabel: string;
  sizeLabel: string;
  /** Absolute URL to GET /api/download/:fileId — triggers the actual file save. */
  downloadUrl: string;
}

export type ImageFormatId = "JPG" | "PNG" | "WEBP" | "GIF" | "BMP" | "TIFF";

export interface LoadedImageSource {
  file: File;
  previewUrl: string;
  filename: string;
  originalFormat: string;
  width: number;
  height: number;
  sizeBytes: number;
}

export interface ImageResult {
  beforeLabel: string;
  beforeSizeLabel: string;
  afterLabel: string;
  afterSizeLabel: string;
  savedPercent: number;
  format: ImageFormatId;
  targetResolution: string;
  finalSizeLabel: string;
  outputUrl: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

/** Result of GET /api/health, used to drive the real "Engine Status" indicator. */
export interface HealthStatus {
  online: boolean;
  version?: string;
  latencyMs?: number;
}
