# Gunakan image Node.js berbasis Alpine yang ringan
FROM node:20-alpine

# Set working directory di dalam container
WORKDIR /app

# Salin file konfigurasi package npm
COPY package.json ./

# Install semua dependencies (termasuk react-is yang tadi sempat hilang karena restore)
RUN npm install --legacy-peer-deps && npm install react-is --legacy-peer-deps

# Salin seluruh sisa file source code
COPY . .

# Build frontend Vite (akan menghasilkan folder dist/ atau public/ tergantung config)
RUN npm run build

# Ekspos port backend Express
EXPOSE 3000

# Jalankan server menggunakan tsx (karena server.ts berbasis TypeScript)
CMD ["npx", "tsx", "server.ts"]
