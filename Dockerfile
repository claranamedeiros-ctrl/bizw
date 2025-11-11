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
# Tell Playwright to use the pre-installed browsers
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Copy standalone build
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
