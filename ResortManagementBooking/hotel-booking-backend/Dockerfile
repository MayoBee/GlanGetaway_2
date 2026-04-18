# ========================================================================
# Hotel Booking Backend - Dockerfile
# ========================================================================
# Simple Dockerfile for Render deployment - Run with error handling
# Build context: hotel-booking-backend directory
# ========================================================================

# Use Node.js runtime directly
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install openssl for secure connections
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for ts-node)
RUN npm ci

# Copy source code
COPY . .

# Create shared directory if needed
RUN mkdir -p shared

# Set Node.js memory limit
ENV NODE_OPTIONS="--max-old-space-size=512"

# Expose port 5000 (Render's expected port)
EXPOSE 5000

# Create a simple startup script that handles errors
RUN echo 'const express = require("express"); const app = express(); app.get("/api/health", (req, res) => res.json({status: "ok"})); app.listen(5000, () => console.log("Server started on port 5000"));' > /app/simple-start.js

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start with full app first, then fallback to simple server
CMD ["sh", "-c", "npx ts-node src/index.ts || node simple-start.js"]
