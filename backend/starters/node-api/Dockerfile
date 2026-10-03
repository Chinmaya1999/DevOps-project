FROM node:20-alpine
WORKDIR /app

# Install dependencies first (Docker caches this layer until package.json changes)
COPY package*.json ./
RUN npm install --omit=dev

# Then copy the source code
COPY . .

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "server.js"]
