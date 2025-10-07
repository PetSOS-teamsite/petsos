# Multi-stage Docker build for PetSOS

# Stage 1: Build frontend and backend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine AS production

WORKDIR /app

# Install ALL dependencies (including tsx for migrations)
COPY package*.json ./
RUN npm ci

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/client/dist ./client/dist

# Copy necessary runtime files
COPY shared ./shared
COPY server ./server
COPY scripts ./scripts
COPY drizzle.config.ts ./

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {if (r.statusCode !== 200) process.exit(1)})"

# Set environment
ENV NODE_ENV=production

# Start application
CMD ["node", "dist/index.js"]
