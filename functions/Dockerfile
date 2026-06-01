# Use Node.js 20 runtime
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application code
COPY . .

# Expose port (Cloud Run assigns PORT env variable)
EXPOSE ${PORT:-8080}

# Start the server
CMD ["node", "server.js"]
