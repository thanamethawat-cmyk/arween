#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL is required (postgresql://...)"
  exit 1
fi

if [ -z "$NEXTAUTH_SECRET" ]; then
  echo "NEXTAUTH_SECRET is required"
  exit 1
fi

echo "Applying Prisma schema to database..."
npx prisma db push --skip-generate

echo "Starting ARWEEN on port ${PORT:-8080}..."
exec node server.js
