# A local context for Compose; source code is fetched only inside the build.
FROM node:22-slim AS source

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    git \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /upstream
ARG SOURCE_COMMIT
RUN set -eu; \
    if ! printf '%s\n' "${SOURCE_COMMIT:-}" | grep -Eq '^[0-9a-f]{40}$'; then \
        echo 'SOURCE_COMMIT must be a full 40-character lowercase Git commit' >&2; \
        exit 1; \
    fi; \
    git init --quiet; \
    git remote add origin https://github.com/NeuraiProject/neurai-wallet-services.git; \
    git fetch --quiet --depth=1 origin "$SOURCE_COMMIT"; \
    git checkout --quiet --detach FETCH_HEAD; \
    test "$(git rev-parse HEAD)" = "$SOURCE_COMMIT"; \
    rm -rf .git

# Runtime matches the upstream Dockerfile at the pinned source revision.
FROM node:22-slim
ENV NODE_ENV=production

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    openssl \
 && rm -rf /var/lib/apt/lists/*

ARG SOURCE_COMMIT
LABEL org.opencontainers.image.source="https://github.com/NeuraiProject/neurai-wallet-services" \
      org.opencontainers.image.revision="$SOURCE_COMMIT"

WORKDIR /app
COPY --from=source /upstream/package.json /upstream/package-lock.json ./
RUN npm ci --omit=dev

COPY --from=source /upstream/ ./
COPY --from=source /upstream/docker/wallet-services/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 19020
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
