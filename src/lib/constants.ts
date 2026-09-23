import type { FaqItem, NavItem } from "@/lib/types";

export const NAV_ITEMS: NavItem[] = [
  { label: "Home", path: "home", href: "/", icon: "home" },
  {
    label: "Video Downloader",
    path: "video-downloader",
    href: "/video-downloader",
    icon: "download",
  },
  {
    label: "Video to Audio",
    path: "video-to-audio",
    href: "/video-to-audio",
    icon: "graphic_eq",
  },
  {
    label: "Image Converter",
    path: "image-converter",
    href: "/image-converter",
    icon: "auto_awesome",
  },
];

export const BOTTOM_NAV_ITEMS: NavItem[] = [
  { label: "Home", path: "home", href: "/", icon: "home" },
  {
    label: "Video",
    path: "video-downloader",
    href: "/video-downloader",
    icon: "download",
  },
  {
    label: "Audio",
    path: "video-to-audio",
    href: "/video-to-audio",
    icon: "graphic_eq",
  },
  {
    label: "Image",
    path: "image-converter",
    href: "/image-converter",
    icon: "auto_awesome",
  },
];

export const FOOTER_TOOL_LINKS: NavItem[] = NAV_ITEMS.slice(1);

export const FOOTER_COMPANY_LINKS: NavItem[] = [
  { label: "How it Works", path: "how-it-works", href: "/#how-it-works", icon: "help_outline" },
  { label: "FAQ", path: "faq", href: "/#faq", icon: "quiz" },
  { label: "Privacy Policy", path: "privacy-policy", href: "/#faq", icon: "shield" },
];

export const VIDEO_FORMATS = [
  { id: "mp4", label: "MP4 (AVC/H.264)" },
  { id: "webm", label: "WebM (VP9)" },
];

export const VIDEO_QUALITIES = [
  { id: "360p", label: "360p", sizeEstimate: "~18.2 MB" },
  { id: "480p", label: "480p", sizeEstimate: "~36.8 MB" },
  { id: "720p", label: "720p", sizeEstimate: "~74.5 MB", badge: "HD" as const },
  { id: "1080p", label: "1080p", sizeEstimate: "~142.6 MB", badge: "BEST" as const },
];

export const AUDIO_FORMATS = [
  { id: "MP3" as const, label: "MP3" },
  { id: "M4A" as const, label: "M4A" },
  { id: "WAV" as const, label: "WAV", sublabel: "Lossless" },
];

export const AUDIO_QUALITIES = [
  { id: "128", kbps: 128 },
  { id: "192", kbps: 192 },
  { id: "256", kbps: 256 },
  { id: "320", kbps: 320, isMax: true },
];

export const IMAGE_FORMATS = ["JPG", "PNG", "WEBP", "GIF", "BMP", "TIFF"] as const;

export const HOME_FAQ: FaqItem[] = [
  {
    question: "What is ActionX?",
    answer:
      "ActionX is a browser-centric utility built for fast, straightforward media downloading and file conversion tasks without heavy configuration.",
  },
  {
    question: "How does the Video Downloader work?",
    answer:
      "When you submit a supported video link, the system analyzes available stream endpoints and presents downloadable format resolutions.",
  },
  {
    question: "Which video formats are supported?",
    answer:
      "ActionX supports primary web video containers including MP4 (H.264/AVC) and WebM (VP9) up to original source resolutions.",
  },
  {
    question: "Which audio formats are available?",
    answer:
      "Extracted audio tracks can be encoded directly into MP3 (up to 320 kbps), Apple AAC / M4A, or uncompressed WAV audio.",
  },
  {
    question: "Which image formats can I convert?",
    answer:
      "You can convert across JPG, PNG, modern WEBP, animated GIF, BMP, and TIFF with fine-tuned compression adjustments.",
  },
  {
    question: "Does ActionX store my uploaded files?",
    answer:
      "Files are processed via transient execution workers and are routinely purged shortly after download generation. Files are not permanently archived.",
  },
];
