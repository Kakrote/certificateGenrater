# -----------------------------
# Stage 1 - Dependencies
# -----------------------------
FROM node:20-slim AS deps
WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    sqlite3 \
    libsqlite3-dev && \
    rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

# -----------------------------
# Stage 2 - Builder
# -----------------------------
FROM node:20-slim AS builder
WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    sqlite3 \
    libsqlite3-dev && \
    rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js standalone application
RUN npm run build

# -----------------------------
# Stage 3 - Production Runner
# -----------------------------
FROM node:20-slim AS runner
WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    sqlite3 \
    libsqlite3-dev && \
    rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Copy standalone build artifacts & prisma seed assets
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src/lib/testingData.json ./src/lib/testingData.json

# Ensure prisma directory permissions
RUN mkdir -p /app/prisma && chmod -R 777 /app/prisma

EXPOSE 3000

# Push database schema, seed testing.xlsx records, and start server
CMD ["sh", "-c", "npx prisma db push --skip-generate && node prisma/seed.js && node server.js"]