# Rebel Explorer
An blockchain explorer for Neurai

## Before you install
- You need to have Node.js and Git installed.

- You can run the Explorer and use an online Neurai RPC service such as
   * https://rpc-main.neurai.org click on mainnet or testnet to find the endpoints.

- The idea is that you run your own Neurai node.
The node needs to be fully indexed and your neurai.conf must include
    * txindex=1
    * addressindex=1
    * assetindex=1
    * timestampindex=1
    * spentindex=1

## How to install
Clone the git repo

Run `npm install`

Run `npm run build`

## How to start

Run `npm start`
### Configuration

The first time you try to start the Explorer, a config.json file will be created.
Update the config.json file with your information and restart restart the node.js app
```
{
    "neurai_password": "anonymous",
    "neurai_username": "anonymous",
    "neurai_url": "https://rpc-main.neurai.org/rpc",
    "httpPort": 8888,
    "headline": "Neurai mainnet",
    "theme": "dark",
    "ipfs_gateway": "https://gateway.pinata.cloud/ipfs/"
}
```

The attributes "headline" and "theme" are used for the graphical user interface. Config is only read once at startup, so you need to restart the app if you change config. 

## Do changes
If you change the graphical user interface (gui folder), you can 
- run `npm run build`
or
- `npm run dev` this is a watcher that will listen for changes

## Run with Docker

The `docker/` folder contains a full `docker-compose.yml` that launches three
services wired together on an internal network:

| Service      | Container                     | Description                                                  |
|--------------|-------------------------------|--------------------------------------------------------------|
| `neuraid`    | `neurai-testnet-node`         | Full Neurai node (testnet by default) with all indexes on    |
| `rpc-proxy`  | `neurai-testnet-rpc-proxy`    | Anonymous RPC proxy in front of `neuraid`                    |
| `explorer`   | `neurai-testnet-explorer`     | This web explorer, talking to the proxy (not the node)       |

Flow: browser → `explorer:8888` → `rpc-proxy:19999` → `neuraid:19101`.

### Requirements
- Docker and Docker Compose v2 (`docker compose`).
- Enough disk space for the Neurai data directory (stored in the
  `neurai_data` named volume).

### Start

From the project root:

```bash
cd docker
docker compose up -d --build
```

The first build takes a while because `neuraid` is compiled from source
(branch `DePIN-Test`). Subsequent rebuilds reuse Docker layer cache.

Once the `neuraid` healthcheck passes, the proxy and the explorer will start
automatically.

- Explorer UI: http://localhost:8888
- RPC proxy:   http://127.0.0.1:19999/rpc (bound to localhost only)
- Node P2P:    port `19100` (testnet)
- Node RPC:    port `19101` (exposed for local use)

### Configuration via environment variables

All three services are configured through environment variables declared in
`docker/docker-compose.yml`. The entrypoints generate the right
`neurai.conf` / `config.json` at container startup, so there is no need to
edit the images.

**Explorer** (`explorer` service):

| Variable                         | Default                         |
|----------------------------------|---------------------------------|
| `EXPLORER_BASE_CURRENCY`         | `XNA`                           |
| `EXPLORER_NEURAI_URL`            | `http://rpc-proxy:19999/rpc`    |
| `EXPLORER_NEURAI_USERNAME`       | `anonymous`                     |
| `EXPLORER_NEURAI_PASSWORD`       | `anonymous`                     |
| `EXPLORER_HTTP_PORT`             | `8888`                          |
| `EXPLORER_HEADLINE`              | `Neurai Testnet`                |
| `EXPLORER_THEME`                 | `light`                         |
| `EXPLORER_IPFS_GATEWAY`          | `https://ipfs.io/ipfs/`         |
| `EXPLORER_PRICE_LOOKUP_ENABLED`  | `false`                         |

**Node** (`neuraid` service): `NEURAI_TESTNET`, `NEURAI_RPC_USER`,
`NEURAI_RPC_PASSWORD`, `NEURAI_RPC_PORT`, index flags (`NEURAI_TXINDEX`,
`NEURAI_ASSETINDEX`, `NEURAI_ADDRESSINDEX`, …), and `NEURAI_DATADIR`.

**RPC proxy** (`rpc-proxy` service): `PROXY_CONCURRENCY`, `PROXY_LOCAL_PORT`,
`NEURAI_NODE_URL`, `NEURAI_RPC_USER`, `NEURAI_RPC_PASSWORD`.

To switch to **Mainnet**, set `NEURAI_TESTNET=0` on `neuraid`, point
`EXPLORER_NEURAI_URL` to the mainnet RPC, adjust ports (`19001/19000` for
mainnet) and update `EXPLORER_HEADLINE`.

### Common operations

```bash
# Follow logs for a single service
docker compose logs -f explorer

# Restart only the explorer after changing env vars
docker compose up -d --no-deps --build explorer

# Stop everything (keeps the chain data volume)
docker compose down

# Stop everything and WIPE the chain data (full re-sync afterwards)
docker compose down -v
```

### Data persistence

The chain data lives in the `neurai_data` named volume, so restarts and
`docker compose down` preserve it. Use `docker compose down -v` only if you
want to wipe it and re-sync from scratch.

 







