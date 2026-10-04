# Rebel Explorer

<p align="center">
  <img src="images/image.png" alt="Rebel Explorer" />
</p>

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

## URL scheme

The explorer uses path-based URLs. Every route is served by the SPA, so
deep-links can be shared and bookmarked.

| Path                  | Shows                                        | Example                                                               |
|-----------------------|----------------------------------------------|-----------------------------------------------------------------------|
| `/`                   | Home — latest blocks and mempool size        | `/`                                                                   |
| `/block/:height`      | Block by height                              | `/block/1573322`                                                      |
| `/blockhash/:hash`    | Block by hash                                | `/blockhash/0000000000000abc…`                                        |
| `/tx/:txid`           | Transaction details                          | `/tx/6eae2ec2f5d896a8f39e6005c19ac6abf39268edfc320a8de9deebdcc57260c0`|
| `/address/:address`   | Address balance, UTXOs and history           | `/address/NihAfZynHrTtYPH8ZSUEhLSCVMstLSV5qN`                         |
| `/assets`             | Paginated list of assets                     | `/assets`                                                             |
| `/asset/:name`        | Asset detail and holders                     | `/asset/SWAP`                                                         |

Notes:
- The search bar accepts a block height, block hash, transaction id, address
  or asset name (in any case); it routes to the matching URL automatically.
- In-app links to a block prefer `/block/:height` when the height is known
  and fall back to `/blockhash/:hash` otherwise.
- Asset names are URL-encoded, so names containing `/` or `#` work.

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

What each image is built from:

- `explorer`: this checkout (build context is the repo root), so local
  changes are what runs. Dependencies come from `package-lock.json` (`npm ci`).
- `neuraid`: branch `DePIN-Test` of NeuraiProject/Neurai at the pinned
  `NODE_SOURCE_COMMIT`.
- `rpc-proxy`: NeuraiProject/neurai-rpc-proxy at the pinned
  `PROXY_SOURCE_COMMIT`.

The node and the proxy are pinned on purpose: Docker caches the layer that
fetches the sources, so following a branch would keep whatever commit the
first build saw. To update them, change the commit in `docker/.env` and run
`docker compose up -d --build`.

### Requirements
- Docker and Docker Compose v2 (`docker compose`).
- Enough disk space for the Neurai data directory (stored in the
  `neurai_data` named volume).

### Start

From the project root:

```bash
cd docker
cp .env.example .env   # then set NODE_RPC_PASSWORD
docker compose up -d --build
```

The first build takes a while because `neuraid` is compiled from source
(branch `DePIN-Test`). Subsequent rebuilds reuse Docker layer cache.

Once the `neuraid` healthcheck passes, the proxy and the explorer will start
automatically.

- Explorer UI: http://localhost:8888 (published on all interfaces)
- RPC proxy:   http://localhost:19999/rpc (published on all interfaces; it
  only forwards whitelisted methods)
- Node P2P:    port `19100` (testnet)
- Node RPC:    http://127.0.0.1:19101 (host loopback only; the proxy reaches
  the node over the Docker network). Do not publish it on `0.0.0.0`: Docker
  bypasses host firewalls such as ufw, and this is the node's full RPC.

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
`NEURAI_EXPECTED_GENESIS` (required: the proxy only routes to a node whose
block 0 has this hash), `NEURAI_NODE_URL`, `NEURAI_RPC_USER`,
`NEURAI_RPC_PASSWORD`.

**Shared values** (`docker/.env`, see `docker/.env.example`): `NODE_RPC_USER`
and `NODE_RPC_PASSWORD` (used by both the node and the proxy),
`NODE_SOURCE_COMMIT` and `PROXY_SOURCE_COMMIT` (pinned sources).

To switch to **Mainnet**, set `NEURAI_TESTNET=0` on `neuraid`, point
`EXPLORER_NEURAI_URL` to the mainnet RPC, adjust ports (`19001/19000` for
mainnet), set `NEURAI_EXPECTED_GENESIS` to the mainnet genesis
`00000044d33c0c0ba019be5c0249730424a69cb4c222153322f68c6104484806` and update
`EXPLORER_HEADLINE`. The network label in the header comes from the node.

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

## License

Released under the [MIT License](LICENSE).

 







