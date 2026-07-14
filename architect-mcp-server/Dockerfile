# Architect AI MCP Server — Cloud Run Dockerfile
# Build: docker build -t architect-ai .
# Run locally: docker run -p 3001:3001 -e OLLAMA_BASE_URL=http://host.docker.internal:11434 architect-ai
# Deploy: gcloud run deploy architect-ai --source . --region us-central1 --project agape-sovereign

FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install production deps only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled output
COPY --from=builder /app/dist ./dist

# Cloud Run sets PORT automatically; default to 3001 for local docker runs
ENV PORT=3001
ENV HOST=0.0.0.0

# OLLAMA_BASE_URL must be set at deploy time to a reachable Ollama instance.
# Options:
#   - Sidecar container in the same Cloud Run service
#   - Ollama running in a separate Cloud Run service or VM
#   - Vertex AI endpoint (requires adapting ollamaChat to use Vertex AI SDK)
ENV OLLAMA_BASE_URL=http://localhost:11434
ENV ARCHITECT_MODEL=gemma4:e4b

EXPOSE $PORT

CMD ["node", "dist/index.js"]
