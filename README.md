# ActionX

Download. Convert. Simplify. — a three-tool media utility suite (Video
Downloader, Video to Audio, Image Converter) with a Next.js frontend and a
real Node.js backend.

```
actionx/
  src/            Next.js frontend (App Router, TypeScript, Tailwind)
  server/         Backend API (Fastify, TypeScript, yt-dlp, ffmpeg, sharp)
```

## Product scope — read this first

ActionX processes media only when the user has permission to download or
convert it, or when the source explicitly permits it. The backend does
**not** implement or attempt to bypass DRM, login/paywall restrictions,
CAPTCHAs, anti-bot systems, rate limits, or any other access control. Video
and audio extraction is powered by [yt-dlp](https://github.com/yt-dlp/yt-dlp),
which fails (by design) on protected/unsupported sources rather than working
around their protections — the backend surfaces that failure as a clear error
instead of pretending to succeed.

## Architecture

- **Frontend** (`src/`): renders the three tools, manages UI state (idle →
  analyzing → ready → processing → success/error), and talks to the backend
  through `src/lib/api.ts`. No media processing happens in the browser.
- **Backend** (`server/`): a Fastify API that
  - analyzes/downloads video via **yt-dlp**,
  - extracts/transcodes audio via **yt-dlp + ffmpeg**,
  - converts images via **sharp** (with an ffmpeg fallback for BMP output,
    since sharp/libvips has no BMP encoder),
  - tracks long-running work with an **in-memory job store** polled by the
    frontend, and
  - serves finished files through a single, path-safe **temporary download
    endpoint**.

## Quick start

You need two terminals — the frontend and backend run as separate processes.

**Terminal 1 — backend**
```bash
cd server
cp .env.example .env
npm install
npm run dev
```
Runs on http://localhost:4000. Watch the startup log — it reports whether
ffmpeg/ffprobe/yt-dlp were found (see "External tools" below).

**Terminal 2 — frontend**
```bash
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:4000
npm install
npm run dev
```
Runs on http://localhost:3000.

Open http://localhost:3000 — the "ENGINE STATUS" badge on the home page
calls `GET /api/health` and shows ONLINE/OFFLINE for real.

## External tools (required for real processing)

The backend calls these as subprocesses with safe argument arrays — never as
shell strings — so user input can't be interpreted as shell syntax. If a tool
is missing, the relevant endpoint returns a clear `503 SERVICE_UNAVAILABLE`
error rather than silently failing or faking success.

### FFmpeg / FFprobe (audio conversion, media probing, BMP image output)

- **Windows**: `winget install Gyan.FFmpeg` (or download a build from
  https://www.gyan.dev/ffmpeg/builds/ and add its `bin/` folder to PATH).
- **macOS**: `brew install ffmpeg`
- **Linux (Debian/Ubuntu)**: `sudo apt install ffmpeg`

Verify: `ffmpeg -version` and `ffprobe -version`.

### yt-dlp (video/audio source analysis and downloading)

- **Windows**: `winget install yt-dlp.yt-dlp` (or `pip install -U yt-dlp` with
  Python installed)
- **macOS**: `brew install yt-dlp`
- **Linux**: `pip install -U yt-dlp` or your distro's package, or download the
  standalone binary from https://github.com/yt-dlp/yt-dlp/releases

Verify: `yt-dlp --version`.

If a binary isn't on PATH, point `FFMPEG_PATH` / `FFPROBE_PATH` / `YTDLP_PATH`
in `server/.env` at its absolute path instead.

## Environment variables

**`server/.env`** (see `server/.env.example` for defaults):

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `4000` | Backend listen port |
| `FRONTEND_URL` | `http://localhost:3000` | The only origin allowed by CORS |
| `TEMP_DIR` | `./tmp` | Where generated/uploaded files are written |
| `MAX_VIDEO_FILE_SIZE_MB` | `500` | Ceiling for video/audio downloads |
| `MAX_IMAGE_FILE_SIZE_MB` | `20` | Ceiling for image uploads |
| `VIDEO_FILE_RETENTION_MINUTES` | `30` | How long a video/audio download stays available |
| `IMAGE_FILE_RETENTION_MINUTES` | `15` | How long a converted image stays available |
| `JOB_RETENTION_MINUTES` | `60` | How long a finished job record stays queryable |
| `RATE_LIMIT_MAX` / `RATE_LIMIT_WINDOW_MS` | `60` / `60000` | Requests per window, per client |
| `FFMPEG_PATH` / `FFPROBE_PATH` / `YTDLP_PATH` | binary names | Override if not on PATH |

**`actionx/.env.local`** (frontend, see `.env.example`):

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | Base URL of the backend |

## API endpoints

All responses follow `{ success: true, ... }` or
`{ success: false, error: { code, message } }`. Status codes: `400` invalid
input, `404` job/file not found, `413` file too large, `429` rate limited,
`422`/`500` processing error, `503` a required binary isn't installed.

| Endpoint | Notes |
|---|---|
| `GET /api/health` | `{ status, service, version, binaries }` — `binaries` reports live ffmpeg/ffprobe/yt-dlp availability |
| `POST /api/video/analyze` | `{ url }` → `{ success, media }` (title, duration, thumbnail, formats, qualities, codecs) |
| `POST /api/video/download` | `{ url, format: "mp4"\|"webm", quality: "360p"\|"480p"\|"720p"\|"1080p" }` → `202 { jobId, status }` |
| `POST /api/audio/analyze` | `{ url }` → `{ success, media }` |
| `POST /api/audio/convert` | `{ url, format: "mp3"\|"m4a"\|"wav", quality: "128"\|"192"\|"256"\|"320", normalize }` → `202 { jobId, status }` |
| `GET /api/jobs/:jobId` | Poll target for the two endpoints above. `{ jobId, status, progress, message? }`, plus `downloadUrl`/`result` when `completed`, or `error` when `failed` |
| `POST /api/image/convert` | `multipart/form-data`: `image`, `format` (`jpg\|jpeg\|png\|webp\|gif\|bmp\|tiff`), `quality` (1–100), `width`, `height`, `keepAspectRatio` → synchronous `{ success, original, output }` |
| `GET /api/download/:fileId` | Streams a generated file. `fileId` is always a server-issued UUID — never a filesystem path — and 404s once expired |

The frontend's polling interval is 500–1000ms (`src/lib/api.ts`); no
WebSocket/SSE infrastructure was added for this first version, but the job
model (`jobId` → poll `GET /api/jobs/:jobId`) is structured so a
WebSocket/SSE push layer can be added later without changing the contract.

## Image conversion usage

```bash
curl -X POST http://localhost:4000/api/image/convert \
  -F "image=@photo.png" \
  -F "format=webp" \
  -F "quality=85" \
  -F "width=1920" \
  -F "height=1080" \
  -F "keepAspectRatio=true"
```
Returns `{ success, original: {...}, output: { ..., downloadUrl } }`. Fetch
`GET http://localhost:4000/api/download/:fileId` (from `output.downloadUrl`)
to retrieve the converted file.

Formats `jpg/jpeg/png/webp/gif/tiff` are encoded natively by sharp. `bmp` is
encoded by rendering a PNG with sharp and piping it through ffmpeg, since
libvips (sharp's underlying library) has no BMP encoder — this needs ffmpeg
installed even for a pure image conversion.

## Video/audio processing limitations

- Only sources yt-dlp itself supports and can access without bypassing any
  protection are processable — DRM'd, private, login-gated, or otherwise
  restricted sources fail with a specific error code
  (`DRM_PROTECTED`, `PRIVATE_CONTENT`, `AUTH_REQUIRED`, `AGE_RESTRICTED`,
  `UNSUPPORTED_SOURCE`, `MEDIA_UNAVAILABLE`).
- Quality options are limited to whatever resolutions the source actually
  offers (matched to the nearest of 360p/480p/720p/1080p); there's no
  upscaling or synthetic quality levels.
- File-size estimates come from yt-dlp's metadata when the source provides
  it; otherwise the UI shows "Estimate unavailable" rather than a fabricated
  number.
- Video download re-muxes/re-encodes to the requested container (mp4/webm)
  via yt-dlp; very long videos or slow connections can take a while — there's
  a 15-minute internal timeout per download/convert job.

## Temporary file policy

- Nothing is written into `src/`, `app/`, or `public/` — all generated and
  uploaded files live under `server/TEMP_DIR` (default `server/tmp/`), named
  with server-generated random UUIDs (never the original filename).
- Files are served only through `GET /api/download/:fileId`, which looks the
  id up in an in-memory registry mapping id → absolute path; there is no way
  for a client to request an arbitrary filesystem path.
- A background sweep (every 60s) deletes files past their retention window
  (`VIDEO_FILE_RETENTION_MINUTES` / `IMAGE_FILE_RETENTION_MINUTES`) and
  removes their registry entries. Finished/failed job records are similarly
  swept after `JOB_RETENTION_MINUTES`.
- Nothing is stored permanently — this is a processing cache, not storage.

## Security notes

- Zod validates every request body/field; multipart uploads are also capped
  by `@fastify/multipart`'s `limits.fileSize`.
- A basic SSRF guard (`server/src/utils/validation.ts`) rejects non-http(s)
  URLs, embedded credentials, and common private/loopback/link-local
  hostname patterns before a URL is ever handed to yt-dlp. This is a literal
  hostname check, not DNS-resolution-based — see "Production considerations".
- All subprocess calls (yt-dlp, ffmpeg, ffprobe) use `child_process.spawn`
  with explicit argument arrays, never a shell string — user-supplied values
  can't be interpreted as shell syntax.
- `fileId`s are `crypto.randomUUID()`, never derived from user input, and
  `resolveTempPath()` verifies the resolved path stays inside `TEMP_DIR`
  before any file operation.
- CORS is restricted to `FRONTEND_URL` (no wildcard `*`); rate limiting is
  applied per client via `@fastify/rate-limit`.
- Errors never leak stack traces or filesystem paths — see
  `server/src/utils/errors.ts`.

## Testing

Basic unit tests (Node's built-in test runner, no extra framework) cover the
functions the task called out specifically:

```bash
cd server
npm test
```

Covers: URL validation & SSRF guards, image-format/quality schema validation,
job creation/status transitions, path-traversal protection, filename
sanitization, and file-expiration logic.

**Manually verify** (see "What was tested" in the delivery notes for this
session's actual results, since this sandbox has no network access to run
`npm install`):
1. `GET /api/health`
2. An invalid/unsupported video URL → structured error
3. Image upload → conversion → download
4. `POST /api/video/download` → job creation → `GET /api/jobs/:jobId` → completion
5. An expired/invalid `fileId` on `GET /api/download/:fileId` → 404

## Production considerations

This is a local-development MVP. Before shipping it, add:

- **Persistent job queue** — Redis + BullMQ (or similar) instead of the
  in-memory `Map` in `server/src/jobs/jobStore.ts`, so jobs survive restarts
  and can be processed by more than one server instance.
- **Object storage** — S3/GCS/R2 instead of local disk, so downloads work
  across multiple instances and survive redeploys.
- **Reverse proxy + HTTPS** — terminate TLS in front of Fastify (nginx,
  Caddy, or a platform load balancer).
- **Stronger rate limiting** — per-IP + per-account tiers, not just a flat
  window.
- **DNS-resolution-based SSRF protection** — the current hostname-literal
  check doesn't catch a hostname that *resolves* to a private IP.
- **Monitoring/alerting** — structured logs already exist (Fastify's pino
  logger); ship them somewhere and add uptime/error-rate alerting.
- **Worker processes** — move yt-dlp/ffmpeg/sharp work off the request
  process into a worker pool so one large job can't starve others.
- **Resource limits** — CPU/memory caps per conversion (container-level or
  `ulimit`), plus concurrency limits on simultaneous jobs.
- **Automatic cleanup that survives crashes** — the current sweep is
  in-memory and interval-based; a persistent job/file store should drive
  cleanup so a crash doesn't strand temp files.

## Frontend structure (unchanged from the design-to-frontend phase)

See `src/` for the Next.js App Router structure, reusable components, and
design tokens (from the Stitch "Kinetic Obsidian" system) — none of that
changed in this phase. The only frontend edits made to support the real
backend were:

- `src/lib/api.ts` — mock functions replaced with real `fetch`/`XMLHttpRequest`
  calls to the backend, plus a new `checkHealth()`.
- `src/lib/types.ts` — added a `downloadUrl` field to `DownloadResult` and
  `AudioResult`, and a `HealthStatus` type.
- `src/lib/utils.ts` — added `triggerBrowserDownload()` (forces a real
  cross-origin file save via blob URL).
- The three tool pages — download buttons now call
  `triggerBrowserDownload()` with the real `downloadUrl`/`outputUrl` instead
  of being a no-op; `downloadVideo`/`convertAudio` calls now also pass the
  source `url`; the image converter passes the actual `File` instead of a
  blob-URL placeholder.
- `src/app/page.tsx` (home) — the "ENGINE STATUS" badge and "LATENCY" chip
  now reflect a real `GET /api/health` check (polled every 20s) instead of
  hardcoded text.

No colors, typography, layout, cards, or navigation changed.
