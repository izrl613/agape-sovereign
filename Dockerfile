FROM node:22-slim

WORKDIR /app

# Copy root package files (frontend at src/, server at root, functions/ workspace)
COPY package.json package-lock.json ./
COPY functions/package.json ./functions/package.json

# Install all dependencies (root + functions workspace)
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the frontend (Vite) and bundle the server (esbuild)
RUN npm run build

# Expose Cloud Run port
EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production

# Start the Express server
CMD ["node", "dist/server.js"]