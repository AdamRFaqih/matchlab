#!/bin/sh
set -e

if [ -n "$DATABASE_URL" ] && [ -d "prisma/migrations" ]; then
  echo "Applying database migrations..."

  PRISMA_BIN="./node_modules/.bin/prisma"
  if [ ! -f "$PRISMA_BIN" ]; then
    PRISMA_BIN="npx prisma"
  fi

  MAX_RETRIES=5
  RETRY_COUNT=0
  MIGRATION_SUCCESS=false

  until [ "$RETRY_COUNT" -ge "$MAX_RETRIES" ]; do
    if $PRISMA_BIN migrate deploy; then
      MIGRATION_SUCCESS=true
      echo "Database migrations applied successfully."
      break
    fi

    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ "$RETRY_COUNT" -lt "$MAX_RETRIES" ]; then
      echo "Database migration attempt $RETRY_COUNT failed, retrying in 2 seconds..."
      sleep 2
    fi
  done

  if [ "$MIGRATION_SUCCESS" != "true" ]; then
    echo "Warning: Automatic database migration failed after $MAX_RETRIES attempts. You can run migrations manually via host port 5435."
  fi
fi

exec "$@"
