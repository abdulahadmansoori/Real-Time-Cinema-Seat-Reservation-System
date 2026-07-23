FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
RUN npm install --workspace=@cinema/shared --workspace=@cinema/api

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN npm run build -w @cinema/shared
WORKDIR /app/apps/api
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app /app
WORKDIR /app/apps/api
COPY apps/api/docker-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
EXPOSE 4000
ENTRYPOINT ["/entrypoint.sh"]
