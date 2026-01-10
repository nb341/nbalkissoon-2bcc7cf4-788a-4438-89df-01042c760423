FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx nx build api --prod

FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /app/dist/apps/api ./dist
COPY --from=builder /app/node_modules ./node_modules

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/main.js"]
