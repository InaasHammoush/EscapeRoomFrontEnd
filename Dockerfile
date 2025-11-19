# Build-Stage: Vite-Build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Runtime-Stage: Nginx liefert statische Dateien
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Optional: Caching/Headers per eigener nginx.conf ergänzen

# Add React Router fallback configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
