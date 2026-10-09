FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json ./
RUN npm install --omit=dev

COPY src ./src

RUN mkdir -p /app/auth
VOLUME ["/app/auth"]

ENV NODE_ENV=production
EXPOSE 3100

CMD ["npm", "start"]
