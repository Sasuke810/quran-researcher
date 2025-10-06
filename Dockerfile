# Multi-stage build for Next.js application

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Temporarily unset NODE_ENV to ensure devDependencies are installed
ENV NODE_ENV=

# Install dependencies using yarn
COPY package.json yarn.lock* ./
RUN yarn --frozen-lockfile

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
# Unset NODE_ENV during build to avoid issues with devDependencies
ENV NODE_ENV=
ENV NEXT_TELEMETRY_DISABLED=1
ENV OPENROUTER_API_KEY=dummy_key_for_build
ENV OPENAI_API_KEY=dummy_key_for_build

# Build the application
RUN yarn build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install wget for healthcheck and bash for scripts
RUN apk add --no-cache wget bash

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy node_modules (includes both prod and dev dependencies for migrations)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copy package.json for yarn migrate command
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/yarn.lock ./yarn.lock

# Copy migration system files and database migrations
COPY --from=builder --chown=nextjs:nodejs /app/src/lib/migrations ./src/lib/migrations
COPY --from=builder --chown=nextjs:nodejs /app/src/lib/database ./src/lib/database
COPY --from=builder --chown=nextjs:nodejs /app/src/lib/models ./src/lib/models
COPY --from=builder --chown=nextjs:nodejs /app/src/lib/repositories ./src/lib/repositories
COPY --from=builder --chown=nextjs:nodejs /app/database/migrations ./database/migrations
COPY --from=builder --chown=nextjs:nodejs /app/database/docker-entrypoint.sh ./database/docker-entrypoint.sh
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig.json ./tsconfig.json

# Make entrypoint script executable
RUN chmod +x /app/database/docker-entrypoint.sh

# Change ownership to nextjs user
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Use custom entrypoint that runs migrations
ENTRYPOINT ["/app/database/docker-entrypoint.sh"]

# Start the application
CMD ["node", "server.js"]
