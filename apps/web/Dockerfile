FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/
RUN npm install --workspace=@cinema/shared --workspace=@cinema/web

FROM node:22-alpine AS build
WORKDIR /app
ARG NEXT_PUBLIC_API_URL=http://localhost:8080
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY packages/shared packages/shared
COPY apps/web apps/web
RUN npm run build -w @cinema/shared
RUN npm run build -w @cinema/web

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=build /app /app
WORKDIR /app/apps/web
EXPOSE 3000
CMD ["npm", "run", "start"]
