# --- Етап 1: збірка фронтенду ---
FROM node:20-alpine AS client
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# --- Етап 2: сервер + зібраний фронтенд ---
FROM node:20-alpine AS server
WORKDIR /app/server

COPY server/package*.json ./
RUN npm install
COPY server/ ./
RUN npx prisma generate

# Зібраний React-додаток у відомому місці
COPY --from=client /app/client/dist /app/client/dist
ENV CLIENT_DIST=/app/client/dist
ENV NODE_ENV=production

COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 4000
CMD ["/app/docker-entrypoint.sh"]
