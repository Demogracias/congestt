FROM node:20 AS backend-builder
WORKDIR /build
COPY backend/package*.json ./
RUN npm ci
COPY backend/tsconfig.json ./
COPY backend/src/ ./src/
RUN npm run build

FROM node:20-alpine AS frontend-builder
WORKDIR /build
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:20-slim
WORKDIR /app
COPY --from=backend-builder /build/node_modules ./backend/node_modules
COPY --from=backend-builder /build/dist ./backend/dist
COPY --from=backend-builder /build/package.json ./backend/
COPY --from=frontend-builder /build/dist ./frontend/dist
RUN mkdir -p /app/data
EXPOSE 3001
CMD ["node", "backend/dist/index.js"]
