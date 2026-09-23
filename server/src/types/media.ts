export type JobType = "video-download" | "audio-convert";
export type JobStatus = "queued" | "processing" | "completed" | "failed";

export interface JobError {
  code: string;
  message: string;
}

export interface Job<TResult = unknown> {
  id: string;
  type: JobType;
  status: JobStatus;
  progress: number;
  message?: string;
  result?: TResult;
  error?: JobError;
  createdAt: number;
  updatedAt: number;
}

export interface VideoDownloadJobResult {
  filename: string;
  sizeLabel: string;
  formatLabel: string;
  qualityLabel: string;
  downloadUrl: string;
}

export interface AudioConvertJobResult {
  filename: string;
  formatLabel: string;
  qualityLabel: string;
  durationLabel: string;
  sizeLabel: string;
  downloadUrl: string;
}

export interface VideoFormatInfo {
  id: string;
  label: string;
}

export interface VideoQualityInfo {
  id: string;
  label: string;
  sizeEstimate: string;
  badge?: "HD" | "BEST";
}

export interface VideoAnalyzeResult {
  title: string;
  host: string;
  duration: number;
  thumbnail: string;
  fps: number | null;
  hdr: boolean;
  bitrate: string;
  audioCodec: string;
  videoCodec: string;
  formats: VideoFormatInfo[];
  qualities: VideoQualityInfo[];
}

export interface AudioAnalyzeResult {
  title: string;
  subtitle: string;
  host: string;
  duration: number;
  thumbnail: string;
  sampleRateLabel: string;
}

export interface ImageConvertResult {
  success: true;
  original: {
    filename: string;
    format: string;
    width: number;
    height: number;
    size: number;
  };
  output: {
    format: string;
    width: number;
    height: number;
    size: number;
    downloadUrl: string;
  };
}

/** In-memory registry entry for a file made available for download. */
export interface StoredFile {
  id: string;
  absolutePath: string;
  filename: string;
  mimeType: string;
  createdAt: number;
  expiresAt: number;
}
