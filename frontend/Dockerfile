FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json next.config.mjs postcss.config.mjs tailwind.config.ts ./
COPY src/ src/
COPY public/ public/
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/.next/ .next/
COPY --from=builder /app/public/ public/
EXPOSE 3000
CMD ["npm", "start"]
