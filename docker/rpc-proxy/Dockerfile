# ── Neurai RPC Proxy ───────────────────────────────────────────────────────
FROM node:lts-slim

ARG REPO_URL=https://github.com/NeuraiProject/neurai-rpc-proxy.git
ARG REPO_REF=master

ENV NODE_ENV=production

RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN git clone --depth 1 --branch "${REPO_REF}" "${REPO_URL}" /tmp/src \
 && cp -a /tmp/src/. /app/ \
 && rm -rf /tmp/src \
 && (npm ci --omit=dev || npm install --omit=dev)

COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 19999

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
