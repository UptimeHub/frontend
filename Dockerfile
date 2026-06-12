FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_BASE_URL=/gateway
ARG VITE_KEYCLOAK_URL=http://84.247.166.242:8080
ARG KEYCLOAK_EXCHANGE_BASE_URL=/keycloak
ARG VITE_KEYCLOAK_REALM=booking-system
ARG VITE_KEYCLOAK_CLIENT_ID=frontend-client
ARG ENABLE_DEV_PANEL=false

RUN VITE_API_BASE_URL="$VITE_API_BASE_URL" \
  VITE_KEYCLOAK_URL="$VITE_KEYCLOAK_URL" \
  VITE_KEYCLOAK_TOKEN_BASE_URL="$KEYCLOAK_EXCHANGE_BASE_URL" \
  VITE_KEYCLOAK_REALM="$VITE_KEYCLOAK_REALM" \
  VITE_KEYCLOAK_CLIENT_ID="$VITE_KEYCLOAK_CLIENT_ID" \
  VITE_ENABLE_DEV_TOKEN="$ENABLE_DEV_PANEL" \
  npm run build

FROM nginx:1.29-alpine

LABEL app="uptimehub-frontend"

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8000
