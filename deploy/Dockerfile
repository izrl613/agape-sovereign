FROM node:20-slim

WORKDIR /app

# Install dependencies for local LLM communication
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .

# Expose the MCP server port
EXPOSE 3000

# Start the server
CMD ["npm", "start"]
