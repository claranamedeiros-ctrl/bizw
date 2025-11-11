# Stage 1: Build application
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production - Use Playwright image with browsers pre-installed
FROM mcr.microsoft.com/playwright:v1.56.1-noble

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy standalone build
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# Note: public directory is empty, Next.js standalone handles static files

# Create symlink from where Playwright expects browsers to where they actually are
# Playwright in standalone looks at: /opt/render/.cache/ms-playwright/chromium_headless_shell-1194/
# Playwright image has them at: /ms-playwright/chromium-1194/
RUN mkdir -p /opt/render/.cache/ms-playwright && \
    ln -s /ms-playwright/chromium-1194 /opt/render/.cache/ms-playwright/chromium_headless_shell-1194

EXPOSE 3000

CMD ["node", "server.js"]
