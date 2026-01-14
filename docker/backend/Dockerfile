# Secbank CBS - Backend Dockerfile
# Node.js + Express + tRPC Backend Service

FROM node:22-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

WORKDIR /app

# ============================================
# Dependencies Stage
# ============================================
FROM base AS deps

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

# Install all dependencies (including dev for build)
RUN pnpm install --frozen-lockfile

# ============================================
# Build Stage
# ============================================
FROM base AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the backend
RUN pnpm run build

# ============================================
# Production Stage
# ============================================
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 secbank

# Copy package files for production install
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/shared ./shared

# Change ownership to non-root user
RUN chown -R secbank:nodejs /app

USER secbank

# Expose backend port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start the backend server
CMD ["node", "dist/index.js"]
