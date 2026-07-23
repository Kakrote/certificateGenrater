# Stage 1: Dependencies
FROM node:20-slim AS deps
WORKDIR /app

# Install native build tools for better-sqlite3
RUN apt-get update && apt-get install -y python3 make g++ sqlite3 libsqlite3-dev --no-install-recommends && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Builder
FROM node:20-slim AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y python3 make g++ sqlite3 libsqlite3-dev --no-install-recommends && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV DATABASE_URL="file:./prisma/dev.db"

# Generate Prisma Client & push schema to SQLite DB
RUN npx prisma generate
RUN npx prisma db push

# Build Next.js application
RUN npm run build

# Stage 3: Runner
FROM node:20-slim AS runner
WORKDIR /app

RUN apt-get update && apt-get install -y sqlite3 libsqlite3-dev --no-install-recommends && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL="file:./prisma/dev.db"

# Create app user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application and node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

# Ensure SQLite directory has write permissions
RUN chown -R nextjs:nodejs /app/prisma

USER nextjs

EXPOSE 3000

CMD ["npm", "start"]
