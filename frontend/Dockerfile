FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
ENV NEXT_PUBLIC_API_URL=http://localhost:3000/api
ENV NEXT_PUBLIC_WS_URL=http://localhost:3003
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3100
ENV PORT=3100
ENV HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
