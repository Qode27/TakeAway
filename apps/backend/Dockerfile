FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json tsconfig.base.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/config/package.json packages/config/package.json

RUN npm install

COPY . .
RUN npm run db:generate
RUN npm run build -w @order-hub/shared
RUN npm run build -w @order-hub/config
RUN npm run build -w @order-hub/backend

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app /app
EXPOSE 4000
CMD ["npm", "run", "start", "-w", "@order-hub/backend"]
