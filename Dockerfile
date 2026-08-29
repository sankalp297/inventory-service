FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine
RUN addgroup -S appuser && adduser -S appuser -G appuser
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY src/ ./src/
USER appuser
EXPOSE 3000
CMD ["node", "src/index.js"]