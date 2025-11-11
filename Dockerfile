# Stage 1: Dependencies
FROM node:20-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Stage 2: Build with all dev dependencies
FROM node:20-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: Production runtime with Playwright
FROM mcr.microsoft.com/playwright:v1.56.1-noble AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy standalone build output (includes node_modules with playwright)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Install Chromium browsers in the location where Render expects them
# Render runs as user 'render' with HOME=/opt/render
# So Playwright looks for browsers at /opt/render/.cache/ms-playwright/
RUN mkdir -p /opt/render/.cache && \
    HOME=/opt/render npx --yes playwright@1.56.1 install chromium --with-deps && \
    chmod -R 777 /opt/render/.cache

EXPOSE 3000

CMD ["node", "server.js"]
