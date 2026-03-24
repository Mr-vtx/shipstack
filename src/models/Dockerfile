FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

RUN mkdir -p src/config/geoip

EXPOSE 8080

ENV NODE_ENV=production

CMD ["node", "server.js"]