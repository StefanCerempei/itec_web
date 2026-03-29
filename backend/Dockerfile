FROM node:20-bookworm-slim

# Install runtimes/compilers used by /api/compile.
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    gcc \
    g++ \
    clang \
    default-jdk-headless \
    golang-go \
    rustc \
    cargo \
    mono-devel \
    mono-runtime \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["npm", "start"]
