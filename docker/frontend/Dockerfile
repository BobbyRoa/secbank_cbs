# Secbank CBS - Frontend Dockerfile
# React + Vite Frontend served via Nginx

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

# Install all dependencies
RUN pnpm install --frozen-lockfile

# ============================================
# Build Stage
# ============================================
FROM base AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build argument for API URL (can be overridden at build time)
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL

# Build the frontend
RUN pnpm run build

# ============================================
# Production Stage - Nginx
# ============================================
FROM nginx:alpine AS runner

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx configuration
COPY docker/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built frontend files
COPY --from=builder /app/dist/client /usr/share/nginx/html

# Create non-root user for security
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Expose frontend port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80 || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
