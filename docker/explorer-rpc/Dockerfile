# ── Rebel XNA Explorer ─────────────────────────────────────────────────────
# Built from this checkout, so what runs is what you have locally. The build
# context is the repo ROOT; docker-compose.yml builds it with:
#     build: { context: .., dockerfile: docker/explorer-rpc/Dockerfile }
FROM node:lts-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    python3 \
    make \
    g++ \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Dependencies first for better layer caching. npm ci installs exactly what
# package-lock.json says, so every build gets the same versions.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build \
 && npm prune --omit=dev

ENV NODE_ENV=production

COPY docker/explorer-rpc/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 8888

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
