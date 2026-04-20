#!/bin/sh
set -eu

: "${EXPLORER_BASE_CURRENCY:=XNA}"
: "${EXPLORER_HTTP_PORT:=8888}"
: "${EXPLORER_HEADLINE:=Neurai Testnet}"
: "${EXPLORER_THEME:=dark}"
: "${EXPLORER_IPFS_GATEWAY:=https://gateway.pinata.cloud/ipfs/}"
: "${EXPLORER_PRICE_LOOKUP_ENABLED:=false}"

: "${EXPLORER_NEURAI_URL:=http://rpc-proxy:19999/rpc}"
: "${EXPLORER_NEURAI_USERNAME:=anonymous}"
: "${EXPLORER_NEURAI_PASSWORD:=anonymous}"

case "${EXPLORER_PRICE_LOOKUP_ENABLED}" in
  true|false)
    ;;
  *)
    echo "[entrypoint] invalid EXPLORER_PRICE_LOOKUP_ENABLED=${EXPLORER_PRICE_LOOKUP_ENABLED}, using false"
    EXPLORER_PRICE_LOOKUP_ENABLED=false
    ;;
esac

export EXPLORER_BASE_CURRENCY
export EXPLORER_NEURAI_URL
export EXPLORER_NEURAI_USERNAME
export EXPLORER_NEURAI_PASSWORD
export EXPLORER_HTTP_PORT
export EXPLORER_HEADLINE
export EXPLORER_THEME
export EXPLORER_IPFS_GATEWAY
export EXPLORER_PRICE_LOOKUP_ENABLED

node <<'EOF'
const fs = require("fs");

const config = {
  baseCurrency: process.env.EXPLORER_BASE_CURRENCY,
  neurai_username: process.env.EXPLORER_NEURAI_USERNAME,
  neurai_password: process.env.EXPLORER_NEURAI_PASSWORD,
  neurai_url: process.env.EXPLORER_NEURAI_URL,
  httpPort: Number.parseInt(process.env.EXPLORER_HTTP_PORT || "8888", 10),
  headline: process.env.EXPLORER_HEADLINE,
  theme: process.env.EXPLORER_THEME,
  ipfs_gateway: process.env.EXPLORER_IPFS_GATEWAY,
  price_lookup_enabled: process.env.EXPLORER_PRICE_LOOKUP_ENABLED === "true"
};

fs.writeFileSync("/app/config.json", `${JSON.stringify(config, null, 2)}\n`);
EOF

echo "[entrypoint] config.json generated, starting explorer on port ${EXPLORER_HTTP_PORT}"
exec npm start
