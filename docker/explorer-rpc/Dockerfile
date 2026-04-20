# ── Rebel XNA Explorer ─────────────────────────────────────────────────────
FROM node:lts-slim

ARG REPO_URL=https://github.com/NeuraiProject/rebel-xna-explorer.git
ARG REPO_REF=master

RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    ca-certificates \
    python3 \
    make \
    g++ \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN git clone --depth 1 --branch "${REPO_REF}" "${REPO_URL}" /tmp/src \
 && cp -a /tmp/src/. /app/ \
 && rm -rf /tmp/src \
 && npm install \
 && npm run build \
 && npm prune --omit=dev

ENV NODE_ENV=production

COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 8888

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
