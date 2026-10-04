import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";

import getConfig from "./getConfig.js";
import thumbnail from "./thumbnail.js";
import blockchain, { rpcErrorMessage } from "./blockchain.js";
import * as explorer from "./explorer.js";
import compression from "compression";

const CONFIG = getConfig();
const app = express();
import { getDebugMessage } from "./update.js";

const VERSION = JSON.parse(fs.readFileSync("./package.json", "utf8")).version;

process.on("uncaughtException", (error, origin) => {
  console.log("----- Uncaught exception -----");
  console.log(error);
  console.log("----- Exception origin -----");
  console.log(origin);
});

process.on("unhandledRejection", (reason, promise) => {
  console.log("----- Unhandled Rejection at -----");
  console.log(promise);
  console.log("----- Reason -----");
  console.log(reason);
});

app.use(compression());

//Send human readable JSON
app.set("json spaces", 4);
//Satoshis are bigint inside the server; one that slips through still serializes
app.set("json replacer", (_, value) => (typeof value === "bigint" ? value.toString() : value));
const port = process.env.PORT || CONFIG.httpPort || 80;

//USE CORS
app.use(cors());

//Do this to be able to get IP of request by request.ip
app.set("trust proxy", true);

//ACCEPT BODY POST DATA, is this really needed?
app.use(express.json());

//STATIC CONTENT
//Vite puts a hash in every file name under static/, so they never change.
//Not "assets/": that path is the page that lists the assets.
app.use(
  "/static",
  express.static("dist/static", { immutable: true, maxAge: "1y", fallthrough: false })
);
app.use(express.static("dist", { index: false }));

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
app.get("/debug", (req, res) => {
  res.send(getDebugMessage());
});

//Answer with the data, or with {error} and a status that says whose fault it was
function send(response, promise) {
  Promise.resolve(promise)
    .then((data) => response.send(data))
    .catch((e) => {
      let status = 500;
      if (e instanceof explorer.NotFoundError) status = 404;
      else if (e instanceof explorer.BadRequestError) status = 400;
      if (status === 500) console.dir(e);
      response.status(status).send({ error: rpcErrorMessage(e), ...(e && e.extra ? e.extra : {}) });
    });
}

//Which chain the node follows, asked in the background so /gui-settings never waits
let network = null;
function refreshNetwork() {
  explorer
    .getChain()
    .then((chain) => (network = chain))
    .catch(() => {});
}
refreshNetwork();

app.get("/gui-settings", (_, response) => {
  if (!network) {
    refreshNetwork();
  }
  response.send({
    baseCurrency: CONFIG.baseCurrency,
    headline: CONFIG.headline,
    theme: CONFIG.theme,
    ipfs_gateway: CONFIG.ipfs_gateway,
    price_lookup_enabled: CONFIG.price_lookup_enabled !== false,
    network,
    version: VERSION,
  });
});
app.get("/thumbnail", thumbnail);

app.get("/gettype/:value", async function (req, res) {
  try {
    const value = String(req.params.value || "").trim();
    const type = await blockchain.getType(value);
    if (type === "UNKNOWN") {
      const name = await blockchain.findAssetName(value);
      if (name) {
        res.send({ type: "ASSET", name });
        return;
      }
    }
    res.send({ type });
  } catch (e) {
    console.dir(e);
    res.status(500).send({ error: rpcErrorMessage(e) });
  }
});

/* ---------------------------------------------------------------------------
 * Network
 * ------------------------------------------------------------------------ */

app.get("/api/stats", (_, res) => send(res, explorer.getStats()));
app.get("/api/price", (_, res) => send(res, explorer.getPriceForChain()));
app.get("/api/mempool", (req, res) => send(res, explorer.getMempool({ limit: req.query.limit })));
app.get("/api/recent", (_, res) => send(res, explorer.getRecentTransactions()));
app.get("/api/chain", (req, res) => send(res, explorer.getChainStrip({ count: req.query.count })));

/* ---------------------------------------------------------------------------
 * Blocks
 * ------------------------------------------------------------------------ */

app.get("/api/blocks", (req, res) =>
  send(res, explorer.getBlockList({ count: req.query.count, before: req.query.before }))
);
app.get("/api/blocks/:id", (req, res) => send(res, explorer.getBlockDetail(req.params.id)));
app.get("/api/blocks/:id/txs", (req, res) =>
  send(res, explorer.getBlockTransactions(req.params.id, { page: req.query.page, size: req.query.size }))
);
app.get("/api/blockheader/:height", async (req, res) => {
  const height = Number(req.params.height);
  if (!Number.isSafeInteger(height) || height < 0) {
    res.status(400).send({ error: "Height must be a non negative integer" });
    return;
  }
  send(res, blockchain.getBlockHeaderByHeight(height));
});
app.get("/api/bestblock", (_, res) => send(res, explorer.getTip()));

/* ---------------------------------------------------------------------------
 * Transactions
 * ------------------------------------------------------------------------ */

app.get("/api/transactions/:id", (req, res) => send(res, explorer.getTransactionDetail(req.params.id)));

/* ---------------------------------------------------------------------------
 * Addresses
 * ------------------------------------------------------------------------ */

app.get("/api/addresses/:address", (req, res) => send(res, explorer.getAddressSummary(req.params.address)));
app.get("/api/addresses/:address/history", (req, res) =>
  send(
    res,
    explorer.getAddressHistory(req.params.address, {
      page: req.query.page,
      size: req.query.size,
      filter: req.query.filter,
    })
  )
);
app.get("/api/addresses/:address/utxos", (req, res) =>
  send(res, explorer.getAddressUtxos(req.params.address, { page: req.query.page, size: req.query.size }))
);
//Raw node answers, linked from the GUI for people who want everything
app.get("/api/addressdeltas/:address", (req, res) => send(res, blockchain.getAddressDeltas(req.params.address)));
app.get("/api/getaddressutxos/:address", (req, res) => send(res, blockchain.getAddressUTXOs(req.params.address)));

/* ---------------------------------------------------------------------------
 * Assets
 * ------------------------------------------------------------------------ */

app.get("/api/assets", (req, res) =>
  send(
    res,
    explorer.getAssetList({
      page: req.query.page,
      size: req.query.size,
      q: req.query.q,
      type: req.query.type,
      sort: req.query.sort,
    })
  )
);
app.get("/api/assets/:name", (req, res) => send(res, explorer.getAssetDetail(req.params.name)));
app.get("/api/assets/:name/holders", (req, res) =>
  send(res, explorer.getAssetHolders(req.params.name, { page: req.query.page, size: req.query.size }))
);
app.get("/api/assetdata/:name", (req, res) => send(res, blockchain.getAssetData("" + req.params.name)));

app.get("/memory", function (_, response) {
  const m = process.memoryUsage();
  response.send(m);
});

//Unknown API paths answer JSON, everything else is a page of the app
app.all("/api/*", (_, res) => res.status(404).send({ error: "Unknown API endpoint" }));

//SPA client routes: index.html lets the React app resolve the path itself
app.get("*", (req, res) => {
  if (path.extname(req.path)) {
    res.status(404).end();
    return;
  }
  res.sendFile(path.resolve("dist/index.html"));
});
