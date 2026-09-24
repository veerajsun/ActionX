# ---- Build stage: compile TypeScript ----
FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- Production stage ----
FROM node:22-slim AS production

# ffmpeg from apt, yt-dlp as the standalone binary (no Python needed).
RUN apt-get update && apt-get install -y --no-install-recommends \
      ffmpeg \
      ca-certificates \
      curl \
    && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist

RUN mkdir -p /app/tmp
ENV TEMP_DIR=/app/tmp
ENV PORT=4000
EXPOSE 4000

CMD ["node", "dist/index.js"]