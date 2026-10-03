FROM node:26-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

FROM node:26-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY . .

# Create uploads directory with proper permissions
RUN mkdir -p /app/uploads/payments /app/uploads/blogs && \
    chmod -R 755 /app/uploads && \
    chown -R node:node /app/uploads

EXPOSE 5001

USER node

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD wget -qO- http://localhost:5001/health || exit 1

CMD ["npm", "start"]