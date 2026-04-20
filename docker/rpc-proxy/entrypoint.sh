#!/bin/sh
set -eu

: "${PROXY_CONCURRENCY:=4}"
: "${PROXY_ENVIRONMENT:=Neurai Testnet}"
: "${PROXY_ENDPOINT:=http://localhost:19999/rpc}"
: "${PROXY_LOCAL_PORT:=19999}"
: "${NEURAI_NODE_NAME:=neuraid-testnet}"
: "${NEURAI_NODE_URL:=http://neuraid:19101}"
: "${NEURAI_RPC_USER:=neurai}"
: "${NEURAI_RPC_PASSWORD:=changeme}"
: "${NEURAI_DEPIN_ENABLED:=false}"
: "${NEURAI_DEPIN_URL:=http://neuraid:19102}"

cat > /app/config.json <<EOF
{
  "concurrency": ${PROXY_CONCURRENCY},
  "endpoint": "${PROXY_ENDPOINT}",
  "environment": "${PROXY_ENVIRONMENT}",
  "local_port": ${PROXY_LOCAL_PORT},
  "nodes": [
    {
      "name": "${NEURAI_NODE_NAME}",
      "username": "${NEURAI_RPC_USER}",
      "password": "${NEURAI_RPC_PASSWORD}",
      "neurai_url": "${NEURAI_NODE_URL}",
      "depin_enabled": ${NEURAI_DEPIN_ENABLED},
      "depin_url": "${NEURAI_DEPIN_URL}"
    }
  ]
}
EOF

echo "[entrypoint] config.json generated, starting rpc-proxy on port ${PROXY_LOCAL_PORT}"
exec npm start
