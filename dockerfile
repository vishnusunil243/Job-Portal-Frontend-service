FROM node:16-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --silent

FROM node:16-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]