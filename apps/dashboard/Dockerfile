FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx nx build dashboard --prod

FROM nginx:alpine AS runner

COPY --from=builder /app/dist/apps/dashboard/browser /usr/share/nginx/html
COPY apps/dashboard/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
