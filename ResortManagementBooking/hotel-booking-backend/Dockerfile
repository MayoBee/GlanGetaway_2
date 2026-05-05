# ========================================================================
# Hotel Booking Backend - Render Dockerfile
# ========================================================================
# This Dockerfile is configured for Render deployment
# Build context: hotel-booking-backend directory
# ========================================================================

# Stage 1: Builder (install deps + compile TypeScript)
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production runner
FROM node:20-alpine AS runner
WORKDIR /app

# Install openssl for secure connections
RUN apk add --no-cache openssl

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy any necessary files (uploads, etc.)
COPY --from=builder /app/uploads ./uploads

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 5000) + '/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start the application
CMD ["node", "dist/src/index.js"]
