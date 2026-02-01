# Frontend Stage
FROM node:20-alpine AS nextjs-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Final Stage
FROM node:20-alpine
WORKDIR /app

# Install Python for Backend
RUN apk add --no-cache python3 py3-pip bash

# Copy and install Backend
WORKDIR /app/backend
COPY backend/requirements.txt ./
RUN pip3 install --no-cache-dir -r requirements.txt --break-system-packages
COPY backend/ ./

# Copy Frontend
WORKDIR /app/frontend
COPY --from=nextjs-builder /app/frontend/.next ./.next
COPY --from=nextjs-builder /app/frontend/public ./public
COPY --from=nextjs-builder /app/frontend/package*.json ./
COPY --from=nextjs-builder /app/frontend/node_modules ./node_modules

# Run Script
WORKDIR /app
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

EXPOSE 8000 5001

ENTRYPOINT ["/bin/sh", "/app/start.sh"]
