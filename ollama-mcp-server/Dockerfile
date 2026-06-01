FROM node:20-slim

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY index.js ./

# Cloud Run will set PORT env var (default 8080)
ENV PORT=8080

EXPOSE 8080

CMD ["node", "index.js"]
