# ── Neurai RPC Proxy ───────────────────────────────────────────────────────
FROM node:lts-slim

ARG REPO_URL=https://github.com/NeuraiProject/neurai-rpc-proxy.git
# A branch, a tag or a full commit hash. Pin a commit: Docker caches this layer,
# so a branch is only fetched once and later commits never reach the image.
ARG REPO_REF=master

ENV NODE_ENV=production

RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN git init -q /tmp/src \
 && git -C /tmp/src fetch -q --depth 1 "${REPO_URL}" "${REPO_REF}" \
 && git -C /tmp/src checkout -q --detach FETCH_HEAD \
 && rm -rf /tmp/src/.git \
 && cp -a /tmp/src/. /app/ \
 && rm -rf /tmp/src \
 && (npm ci --omit=dev || npm install --omit=dev)

COPY extra-whitelist.js /app/extra-whitelist.js
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 19999

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
