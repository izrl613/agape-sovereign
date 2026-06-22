FROM node:20-alpine

WORKDIR /app

# Copy everything first to ensure NPM workspaces can find their directories
COPY . .

# Install all dependencies (required for Vite and esbuild)
RUN npm ci

# Build the frontend and the server bundle
RUN npm run build

# Remove dev dependencies to slim down the image
RUN npm prune --production

# Set production environment
ENV NODE_ENV=production
ENV PORT=8080

# Expose the port (Cloud Run will inject PORT automatically, but we set a default)
EXPOSE 8080

# Start the server
CMD ["npm", "start"]
