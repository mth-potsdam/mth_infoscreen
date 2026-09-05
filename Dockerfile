# syntax=docker/dockerfile:1

FROM node:22-alpine AS frontend-build
WORKDIR /app
COPY shared ./shared
COPY frontend/package*.json ./frontend/
RUN npm ci --prefix frontend
COPY frontend ./frontend
RUN npm run build --prefix frontend

FROM node:22-alpine AS backend-build
WORKDIR /app
COPY shared ./shared
COPY backend/package*.json ./backend/
RUN npm ci --prefix backend
COPY backend ./backend
RUN npm run build --prefix backend

FROM node:22-alpine AS runner
RUN apk add --no-cache tzdata
ENV TZ=Europe/Berlin \
    NODE_ENV=production \
    CONFIG_DIR=/data
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY --from=backend-build /app/backend/dist ./dist
COPY --from=frontend-build /app/frontend/dist ./public
RUN addgroup -S nodejs \
  && adduser -S nodejs -G nodejs \
  && mkdir -p /data \
  && chown -R nodejs:nodejs /app /data
USER nodejs
VOLUME ["/data"]
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1
CMD ["node", "dist/server.js"]
