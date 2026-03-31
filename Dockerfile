# Use stable base
FROM node:20-slim

WORKDIR /app

# Install system deps (needed for wait + optional puppeteer)
RUN apt-get update && apt-get install -y \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm install --production

RUN ls /app/

# Copy app code
COPY . ./


# Default (can be overridden in compose)
CMD ["node", "app/server.js"]