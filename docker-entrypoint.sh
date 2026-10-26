#!/bin/sh
set -e

if [ -n "$DATABASE_URL" ] && [ -d "prisma/migrations" ]; then
  echo "Applying database migrations..."
  node ./node_modules/prisma/build/index.js migrate deploy || {
    echo "Warning: Automatic database migration failed. You can run migrations manually via host port 5435."
  }
fi

exec "$@"
