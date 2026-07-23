#!/bin/sh
set -e
cd /app/apps/api
npx prisma migrate deploy
npx tsx prisma/seed.ts
node dist/server.js
