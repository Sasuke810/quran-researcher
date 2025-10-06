#!/bin/sh
set -e

echo "=== Docker Entrypoint ==="
echo "Running database migrations..."

# Change to app directory where package.json is located
cd /app

# Run migrations using the existing yarn migrate script
yarn migrate

echo "Migrations complete! Starting Next.js application..."
exec "$@"

