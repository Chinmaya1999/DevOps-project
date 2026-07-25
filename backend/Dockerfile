FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY . .

# Create uploads directory with proper permissions
RUN mkdir -p /app/uploads/payments && \
    chmod -R 755 /app/uploads && \
    chown -R node:node /app/uploads

EXPOSE 5001

USER node

CMD ["npm", "start"]