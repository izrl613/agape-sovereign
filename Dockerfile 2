# ---- Builder stage ----
FROM node:22-slim AS builder
WORKDIR /app
COPY . .
# Install dependencies and build frontend & functions
RUN npm ci && npm run build && npm run build --prefix functions

# ---- Runtime stage ----
FROM node:22-slim
WORKDIR /app
# Copy built artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/functions/lib ./functions/lib
COPY --from=builder /app/functions/package.json ./functions/package.json
# Install production dependencies for functions only
RUN cd functions && npm ci --omit=dev
ENV NODE_ENV=production
CMD ["node", "dist/server.js"]