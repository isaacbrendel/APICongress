# Dockerfile (unified)

# ===== Stage 1: Build React frontend =====
FROM node:18-alpine as frontend
WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./
RUN npm install

# Copy frontend source code
COPY frontend/ ./
RUN npm run build

# ===== Stage 2: Build & run Node backend =====
FROM node:18-alpine
WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./
RUN npm install

# Copy backend source
COPY backend/ ./

# Copy built React assets from Stage 1 into backend "public" folder
# so that Node can serve them on the same port.
COPY --from=frontend /app/frontend/build ./public

# Expose port 5000 (the Node server)
EXPOSE 5000

# Environment variables (injected at runtime via Docker Compose)
ENV PORT=5000

CMD ["node", "server.js"]
