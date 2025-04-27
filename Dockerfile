FROM node:18-bullseye-slim AS base

## u should specify the target stage from docker-compos file
FROM base AS development
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5500
CMD [ "npm", "run", "dev" ]

FROM base AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5500
CMD [ "npm", "start"]
