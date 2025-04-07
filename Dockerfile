# Base image
FROM node:18-alpine AS base
WORKDIR /app

# Dependencies
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine for understanding why libc6-compat might be needed
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json* ./
RUN npm ci

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Set environment variables
ARG DATABASE_URL
ARG OPENSEARCH_URL
ARG NEXTAUTH_SECRET
ARG NEXTAUTH_URL
ENV DATABASE_URL=${DATABASE_URL}
ENV OPENSEARCH_URL=${OPENSEARCH_URL}
ENV NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
ENV NEXTAUTH_URL=${NEXTAUTH_URL}

RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]