# ===== Stage 1: Build React frontend =====
FROM node:18-alpine as frontend
WORKDIR /app/frontend

# Copy frontend package files and install dependencies
COPY frontend/package*.json ./
RUN npm install

# Copy frontend source code and build the React app
COPY frontend/ ./
RUN npm run build

# ===== Stage 2: Build & run Node backend =====
FROM node:18-alpine
WORKDIR /app

# Copy backend package files and install dependencies
COPY backend/package*.json ./
RUN npm install

# Copy backend source code
COPY backend/ ./

# Copy built React assets from Stage 1 into the "public" folder
# so that Node (server.js) can serve them
COPY --from=frontend /app/frontend/build ./public

# Expose the port the Node server listens on
EXPOSE 5000

# Set environment variable for the port
ENV PORT=5000

# Start the Node server
CMD ["node", "server.js"]
