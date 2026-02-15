# isce-auth-mobile (auth web) — Next.js frontend
# -------------------------------------------------------
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# --- deps ---
FROM base AS deps
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile || pnpm install

# --- build ---
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build args become env vars at build time for NEXT_PUBLIC_*
ARG NEXT_PUBLIC_URL
ARG NEXT_PUBLIC_AUTH_API_URL
ARG NEXT_PUBLIC_AUTH_WEB_URL
ARG NEXT_PUBLIC_ALLOWED_APP_ORIGINS
ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

ENV NEXT_PUBLIC_URL=$NEXT_PUBLIC_URL
ENV NEXT_PUBLIC_AUTH_API_URL=$NEXT_PUBLIC_AUTH_API_URL
ENV NEXT_PUBLIC_AUTH_WEB_URL=$NEXT_PUBLIC_AUTH_WEB_URL
ENV NEXT_PUBLIC_ALLOWED_APP_ORIGINS=$NEXT_PUBLIC_ALLOWED_APP_ORIGINS
ENV NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=$NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

RUN pnpm run build

# --- prod ---
FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/next.config.ts ./next.config.ts

EXPOSE 725

CMD ["pnpm", "start", "-p", "725"]
