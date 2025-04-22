#!/bin/sh
# entrypoint.sh

# Exit immediately if a command exits with a non-zero status.
set -e

# Run Prisma database sync (use migrate deploy if using migrations in prod)
echo "ENTRYPOINT: Running database sync (db push)..."
# Use npx to ensure the project's Prisma version is used
npx prisma db push



# Run Prisma seeding mechanism
echo "ENTRYPOINT: Running database seeding..."
# This executes the script defined in package.json's prisma.seed field

node prisma/seed.js

echo "ENTRYPOINT: Starting application..."

# Execute the command passed as arguments (the CMD from Dockerfile)
exec "$@"