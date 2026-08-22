FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/package.json
COPY backend/package.json ./backend/package.json

# Install all dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the frontend and backend
RUN npm run build

# Expose port
EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production

# Start the server
CMD ["npm", "start"]
