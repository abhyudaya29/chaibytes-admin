# ==========================================
# Stage 1: Build Phase
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code and build config
COPY . .

# Build-time environment variable arguments for Vite
ARG VITE_BASE_URL=https://flownextai.in/api
ENV VITE_BASE_URL=$VITE_BASE_URL

# Build the production static bundles
RUN npm run build

# ==========================================
# Stage 2: Serve Phase (Nginx)
# ==========================================
FROM nginx:1.25-alpine AS runner

# Copy customized Nginx server configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy production bundles from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
