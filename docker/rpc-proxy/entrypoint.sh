#!/bin/sh
set -eu

: "${PROXY_CONCURRENCY:=4}"
: "${PROXY_ENVIRONMENT:=Neurai Testnet}"
: "${PROXY_ENDPOINT:=http://localhost:19999/rpc}"
: "${PROXY_LOCAL_PORT:=19999}"
: "${NEURAI_EXPECTED_GENESIS:=0000008b384aeffecdab182575dc4e86c9f07f90318c65088532660ed9a8a021}"
: "${NEURAI_NODE_NAME:=neuraid-testnet}"
: "${NEURAI_NODE_URL:=http://neuraid:19101}"
: "${NEURAI_RPC_USER:=neurai}"
: "${NEURAI_RPC_PASSWORD:=changeme}"

cat > /app/config.json <<EOF
{
  "concurrency": ${PROXY_CONCURRENCY},
  "endpoint": "${PROXY_ENDPOINT}",
  "environment": "${PROXY_ENVIRONMENT}",
  "expected_genesis": "${NEURAI_EXPECTED_GENESIS}",
  "local_port": ${PROXY_LOCAL_PORT},
  "nodes": [
    {
      "name": "${NEURAI_NODE_NAME}",
      "username": "${NEURAI_RPC_USER}",
      "password": "${NEURAI_RPC_PASSWORD}",
      "neurai_url": "${NEURAI_NODE_URL}"
    }
  ]
}
EOF

echo "[entrypoint] config.json generated, starting rpc-proxy on port ${PROXY_LOCAL_PORT}"
exec npm start
