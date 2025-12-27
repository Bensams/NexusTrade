# Multi-stage Dockerfile for Next.js with Prisma
# Optimized for fast rebuilds and small image size

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Install OpenSSL early (needed for Prisma)
RUN apk add --no-cache openssl libc6-compat

# Copy only package files first (better layer caching)
COPY package.json package-lock.json* ./

# Install dependencies with clean cache
RUN npm ci --prefer-offline && npm cache clean --force

# Copy Prisma schema separately (changes less frequently than source code)
COPY prisma ./prisma

# Generate Prisma Client
RUN npm run prisma:generate

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Set build-time environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/node_modules/.prisma ./node_modules/.prisma

# Copy source files (this layer changes most frequently)
COPY . .

# Build Next.js application
RUN npm run build

# Stage 3: Production runner (minimal image)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install runtime dependencies only
RUN apk add --no-cache openssl libc6-compat \
    && addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Copy only what's needed for production (order matters for layer caching)
COPY --from=builder /app/public ./public

# Set ownership during copy to avoid extra RUN command
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
