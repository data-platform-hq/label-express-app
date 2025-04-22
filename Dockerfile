# ---- Base Node ----
    FROM node:23-alpine AS base
    # Install git, openssl needed for prisma and potentially bcrypt
    RUN apk add --no-cache libc6-compat openssl git
    WORKDIR /app
    
    # ---- Dependencies ----
    FROM base AS deps
    WORKDIR /app
    COPY package.json package-lock.json* ./
    # Install ALL dependencies including devDependencies (Prisma CLI is often a devDep)

    RUN npm install
    
    # ---- Builder ----
    FROM base AS builder
    WORKDIR /app
    COPY --from=deps /app/node_modules ./node_modules
    COPY . .
    # Ensure schema is copied for generation
    COPY prisma ./prisma
    # Generate Prisma Client - essential for build and runtime
    RUN npx prisma generate
    # Build the Next.js app with standalone output
    RUN npm run build
    
    # ---- Runner ----
    FROM base AS runner
    WORKDIR /app
    
    # Set environment to production
    ENV NODE_ENV production
    # Optionally disable Next.js telemetry
    ENV NEXT_TELEMETRY_DISABLED 1
    
    # Set DATABASE_URL (adjust path if needed, ensure it matches volume mount point)
    ENV DATABASE_URL="file:./prod.db"
    
    # Create the data directory (will be overlayed by volume mount)
    RUN mkdir -p /app/data
    
    # Copy necessary production node_modules (if any are generated differently)
    # Often safer to copy the whole node_modules from deps if unsure, but less optimized
    COPY --from=deps /app/node_modules ./node_modules

    
    # Copy application artifacts from the builder stage
    COPY --from=builder /app/public ./public
    COPY --from=builder /app/.next/standalone ./
    COPY --from=builder /app/.next/static ./.next/static
    
    # Copy Prisma schema and migration files needed for deployment
    COPY --from=builder /app/prisma ./prisma
    
    # Copy entrypoint script
    COPY ./entrypoint.sh /app/entrypoint.sh
    RUN chmod +x /app/entrypoint.sh
    
    # Expose the port the app runs on
    EXPOSE 3000
    
    # Use ENTRYPOINT to run migrations/seed and then start the app
    ENTRYPOINT ["/app/entrypoint.sh"]
    
    # Default CMD for the entrypoint (starts the app)
    CMD ["node", "server.js"]
    