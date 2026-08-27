FROM oven/bun:1.4.0 AS build
WORKDIR /app
COPY . .
RUN bun install --frozen-lockfile
RUN bun run build

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/apps/docs/.output ./.output
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
