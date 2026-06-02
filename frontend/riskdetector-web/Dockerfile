# ── 1단계: 빌드 ──────────────────────────────────────────
FROM node:20-slim AS builder
WORKDIR /app

# NEXT_PUBLIC_* 변수는 빌드 타임에 번들에 박혀야 하므로 ARG로 받음
ARG NEXT_PUBLIC_SUPABASE_URL=
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY=
ARG NEXT_PUBLIC_API_BASE_URL=
ARG NEXT_PUBLIC_MOCK_MODE=false
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_MOCK_MODE=$NEXT_PUBLIC_MOCK_MODE

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── 2단계: 실행 ───────────────────────────────────────────
FROM node:20-slim
WORKDIR /app

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=10000
EXPOSE 10000
ENTRYPOINT ["node", "server.js"]
