# ETAP 1: Budowanie aplikacji produkcyjnej (HTML/JS/CSS)
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# ETAP 2: Serwowanie plików przez Nginx (Wymóg produkcyjny k8s)
FROM nginx:alpine
# Kopiujemy zbudowane przez Vite pliki statyczne do folderu Nginxa
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]