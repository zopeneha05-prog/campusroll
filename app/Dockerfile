# ---- CampusRoll: multi-stage build ----
# Stage 1: install production dependencies only
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Stage 2: small runtime image
FROM node:20-alpine
ARG APP_VERSION=dev
ENV NODE_ENV=production \
    APP_VERSION=${APP_VERSION} \
    PORT=3000
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
COPY public ./public
# the official node image ships a non-root 'node' user
USER node
EXPOSE 3000
CMD ["node", "src/index.js"]
