# Używamy oficjalnego, lekkiego obrazu Node.js jako bazy
FROM node:18-alpine

# Ustalamy folder roboczy wewnątrz kontenera
WORKDIR /app

# Kopiujemy pliki opisujące zależności
COPY package*.json ./

# Instalujemy tylko niezbędne biblioteki produkcyjne
RUN npm install --only=production

# Kopiujemy resztę kodu źródłowego (server.js, wordsapi.js itp.)
COPY . .

# Informujemy, na jakim porcie działa nasza aplikacja
EXPOSE 3000

# Komenda uruchamiająca nasz serwer
CMD ["node", "server.js"]