/*
  What each page of the explorer needs, assembled from the node's RPC.

  blockchain.js talks to the node; this file decides what to ask, caches it and
  turns it into the shapes the GUI renders. Amounts leave this file as plain
  decimal strings ("1234.5"), never as numbers, so no digit is lost on the way.
*/
import blockchain, { rpcErrorMessage } from "./blockchain.js";
import { createCache, mapLimit } from "./cache.js";
import getConfig from "./getConfig.js";
import { COIN, rawSatoshis, satoshisToDecimal, toSatoshis } from "./shared/amount.js";
import { ASSET_TYPE_LABELS, assetType, parentAsset } from "./shared/assets.js";
import { ADDRESS_FAMILY_LABELS, addressFamily, isBurnAddress } from "./shared/addresses.js";
import { payloadText, summarizeTransaction } from "./shared/transactions.js";
import { EMISSION, blockSubsidy, maxSupply, totalMined } from "./shared/emission.js";

const CONFIG = getConfig();

export class NotFoundError extends Error {
  constructor(message, extra) {
    super(message);
    this.extra = extra;
  }
}
export class BadRequestError extends Error {}

const HASH = /^[0-9a-fA-F]{64}$/;
const HEIGHT = /^[0-9]{1,12}$/;

function clampInt(value, min, max, fallback) {
  const number = parseInt(value, 10);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

//neurai-rpc sends a float that would lose digits as a decimal string
function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function decimal(satoshis) {
  return satoshis === null || satoshis === undefined ? null : satoshisToDecimal(satoshis);
}

function page(items, pageNumber, size) {
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / size));
  const current = Math.min(Math.max(1, pageNumber), pages);
  return { total, page: current, size, pages, slice: items.slice((current - 1) * size, current * size) };
}

/* ---------------------------------------------------------------------------
 * Chain tip
 * ------------------------------------------------------------------------ */

//Asked at most every 3 s: everything keyed by the tip refreshes with a new block
const tipCache = createCache({ ttl: 3000, max: 1 });
export function getTipHash() {
  return tipCache.get("tip", () => blockchain.getBestBlockHash());
}
export async function getTip() {
  const hash = await getTipHash();
  const summary = await blockSummary(hash);
  return { hash, height: summary.height, time: summary.time };
}

const chainCache = createCache({ ttl: 60000, max: 1 });
export function getChain() {
  return chainCache.get("chain", () => blockchain.getChain());
}

/* ---------------------------------------------------------------------------
 * Blocks
 * ------------------------------------------------------------------------ */

//Keyed by hash, so a block is fetched once; only confirmations change later
const blockCache = createCache({ max: 4000 });
function getBlockByHash(hash) {
  return blockCache.get(hash, () => blockchain.getBlock(hash, 1));
}
const heightHashCache = createCache({ max: 20000 });
//Heights close to the tip can still be reorganized, look those up every time
async function hashAtHeight(height, tipHeight) {
  if (tipHeight - height < 10) return blockchain.getBlockHash(height);
  return heightHashCache.get(String(height), () => blockchain.getBlockHash(height));
}

async function blockSummary(hash) {
  const block = await getBlockByHash(hash);
  return {
    height: block.height,
    hash: block.hash,
    prevHash: block.previousblockhash || null,
    time: block.time,
    txCount: Array.isArray(block.tx) ? block.tx.length : block.nTx || 0,
    size: block.size,
  };
}

//Every visitor polls the latest blocks: answer them all from one walk per tip
const blockListCache = createCache({ max: 100 });
export async function getBlockList({ count, before }) {
  const tipHash = await getTipHash();
  const key = [tipHash, count, before].join(":");
  return blockListCache.get(key, () => walkBlocks({ count, before }));
}

async function walkBlocks({ count, before }) {
  const wanted = clampInt(count, 1, 100, 10);
  const tip = await getTip();
  let top = tip.height;
  if (before !== undefined && before !== null && before !== "") {
    top = Math.min(clampInt(before, 0, Number.MAX_SAFE_INTEGER, tip.height + 1) - 1, tip.height);
  }
  if (top < 0) return { tip: tip.height, blocks: [] };
  const heights = [];
  for (let h = top; h > top - wanted && h >= 0; h--) heights.push(h);
  const blocks = await mapLimit(heights, 8, async (height) => {
    const hash = height === tip.height ? tip.hash : await hashAtHeight(height, tip.height);
    const { prevHash, ...summary } = await blockSummary(hash);
    return summary;
  });
  return { tip: tip.height, blocks };
}

async function resolveBlockId(id) {
  const text = String(id || "").trim();
  const tip = await getTip();
  if (HEIGHT.test(text)) {
    const height = parseInt(text, 10);
    if (height > tip.height) {
      throw new NotFoundError(`Block ${height.toLocaleString("en-US")} does not exist yet.`, { tip: tip.height });
    }
    return { hash: await hashAtHeight(height, tip.height), tip };
  }
  if (HASH.test(text)) return { hash: text.toLowerCase(), tip };
  throw new BadRequestError("A block is looked up by its height or its 64 character hash.");
}

export async function getBlockDetail(id) {
  const { hash, tip } = await resolveBlockId(id);
  let block;
  try {
    block = await getBlockByHash(hash);
  } catch (e) {
    throw new NotFoundError("No block with hash " + hash + ".", { tip: tip.height });
  }
  const txids = block.tx || [];
  //The next block appears after the block was cached: ask the height above instead
  let nextHash = block.nextblockhash || null;
  if (!nextHash && block.height < tip.height) {
    nextHash = await hashAtHeight(block.height + 1, tip.height);
  }

  const coinbase = txids.length ? await getTx(txids[0]) : null;
  const reward = coinbase ? coinbase.vout.reduce((sum, output) => sum + toSatoshis(output.value), 0n) : 0n;

  //Fees need every input's value, which only getrawtransaction carries
  let fees = null;
  let totalOut = null;
  if (txids.length <= 200) {
    const others = await mapLimit(txids.slice(1), 6, (txid) => getTx(txid));
    fees = 0n;
    totalOut = 0n;
    for (const tx of others) {
      const summary = summarizeTransaction(tx);
      totalOut += summary.totalOut;
      if (summary.fee === null) fees = null;
      else if (fees !== null) fees += summary.fee;
    }
  }

  return {
    hash: block.hash,
    height: block.height,
    confirmations: tip.height - block.height + 1,
    time: block.time,
    mediantime: block.mediantime,
    size: block.size,
    strippedsize: block.strippedsize,
    weight: block.weight,
    version: block.version,
    versionHex: block.versionHex,
    merkleroot: block.merkleroot,
    nonce: block.nonce,
    bits: block.bits,
    difficulty: toNumber(block.difficulty),
    chainwork: block.chainwork,
    previousblockhash: block.previousblockhash || null,
    nextblockhash: nextHash,
    txCount: txids.length,
    reward: decimal(reward),
    fees: decimal(fees),
    subsidy: fees === null ? null : decimal(reward - fees),
    totalOut: decimal(totalOut),
    tip: tip.height,
    raw: { ...block, confirmations: tip.height - block.height + 1, nextblockhash: nextHash || undefined },
  };
}

export async function getBlockTransactions(id, { page: pageNumber, size }) {
  const { hash, tip } = await resolveBlockId(id);
  const block = await getBlockByHash(hash);
  const paged = page(block.tx || [], clampInt(pageNumber, 1, 1e9, 1), clampInt(size, 1, 100, 25));
  const items = await mapLimit(paged.slice, 6, async (txid) => txListItem(await getTx(txid), tip));
  return { total: paged.total, page: paged.page, size: paged.size, pages: paged.pages, items };
}

/* ---------------------------------------------------------------------------
 * Transactions
 * ------------------------------------------------------------------------ */

const txCache = createCache({ max: 5000 });
function getTx(txid) {
  const key = String(txid).toLowerCase();
  return txCache.get(key, async () => {
    const tx = await blockchain.getTransaction(key);
    //Unconfirmed transactions change state soon, keep them only briefly
    if (!tx.blockhash) setTimeout(() => txCache.delete(key), 5000);
    return tx;
  });
}

function confirmationsOf(tx, tip) {
  return tx.height !== undefined && tx.height !== null ? tip.height - tx.height + 1 : 0;
}

function poolJson(pool) {
  return pool ? { name: pool.pool, action: pool.action, asset: pool.asset, amount: decimal(pool.amount) } : null;
}

function txListItem(tx, tip, extra = {}) {
  const summary = summarizeTransaction(tx);
  return {
    txid: tx.txid,
    kind: summary.kind,
    label: summary.label,
    tags: summary.tags,
    inputs: summary.inputCount,
    outputs: summary.outputCount,
    totalOut: decimal(summary.totalOut),
    fee: decimal(summary.fee),
    feeRate: summary.feeRate,
    moved: summary.moved ? { asset: summary.moved.asset, amount: decimal(summary.moved.amount) } : null,
    pool: poolJson(summary.pool),
    size: tx.size,
    vsize: tx.vsize,
    height: tx.height ?? null,
    time: tx.blocktime || tx.time || null,
    confirmations: confirmationsOf(tx, tip),
    pending: !tx.blockhash,
    ...extra,
  };
}

const spentCache = createCache({ max: 20000 });
//A spent output stays spent; an unspent answer is only kept for a short while
function getSpent(txid, index) {
  const key = txid + ":" + index;
  return spentCache.get(key, async () => {
    const spent = await blockchain.getSpentInfo(txid, index);
    if (!spent) setTimeout(() => spentCache.delete(key), 15000);
    return spent;
  });
}

const MAX_RESOLVED_INPUTS = 50;
const MAX_SPENT_LOOKUPS = 100;

export async function getTransactionDetail(id) {
  const txid = String(id || "").trim();
  if (!HASH.test(txid)) {
    throw new BadRequestError("A transaction id is 64 hexadecimal characters.");
  }
  let tx;
  try {
    tx = await getTx(txid);
  } catch (e) {
    const message = rpcErrorMessage(e);
    if (/No such mempool or blockchain transaction|Invalid or non-wallet/i.test(message)) {
      throw new NotFoundError("No transaction with id " + txid + ".");
    }
    throw e;
  }
  const tip = await getTip();

  //Asset inputs carry 0 XNA and no asset: read them from the outputs they spend
  const prevouts = {};
  const unknown = tx.vin
    .filter((input) => input.txid && (input.value === undefined || input.value === 0 || toSatoshis(input.value) === 0n))
    .slice(0, MAX_RESOLVED_INPUTS);
  await mapLimit(unknown, 6, async (input) => {
    try {
      const parent = await getTx(input.txid);
      const output = parent.vout[input.vout];
      if (!output) return;
      const spk = output.scriptPubKey || {};
      prevouts[input.txid + ":" + input.vout] = {
        address: spk.address || (spk.addresses && spk.addresses[0]) || null,
        value: output.value,
        asset: spk.asset || null,
      };
    } catch (e) {}
  });

  const summary = summarizeTransaction(tx, prevouts);
  const spentList = await mapLimit(summary.outputs.slice(0, MAX_SPENT_LOOKUPS), 8, async (output) => {
    if (output.type === "nulldata") return { known: true, spent: null };
    try {
      return { known: true, spent: await getSpent(tx.txid, output.n) };
    } catch (e) {
      return { known: false, spent: null };
    }
  });

  let firstSeen = null;
  if (!tx.blockhash) {
    try {
      const entry = await blockchain.getMempoolEntry(tx.txid);
      firstSeen = entry && entry.time ? entry.time : null;
    } catch (e) {}
  }

  const totals = (list) => {
    const assets = {};
    for (const item of list) {
      if (item.asset) assets[item.asset.name] = (assets[item.asset.name] || 0n) + item.asset.amount;
    }
    return Object.entries(assets).map(([name, amount]) => ({ asset: name, amount: decimal(amount) }));
  };

  return {
    txid: tx.txid,
    hash: tx.hash,
    version: tx.version,
    size: tx.size,
    vsize: tx.vsize,
    locktime: tx.locktime,
    pending: !tx.blockhash,
    blockhash: tx.blockhash || null,
    height: tx.height ?? null,
    confirmations: confirmationsOf(tx, tip),
    time: tx.blocktime || tx.time || firstSeen,
    firstSeen,
    kind: summary.kind,
    label: summary.label,
    tags: summary.tags,
    fee: decimal(summary.fee),
    feeRate: summary.feeRate,
    totalIn: decimal(summary.totalIn),
    totalOut: decimal(summary.totalOut),
    assetsIn: totals(summary.inputs),
    assetsOut: totals(summary.outputs),
    moved: summary.moved ? { asset: summary.moved.asset, amount: decimal(summary.moved.amount) } : null,
    pool: poolJson(summary.pool),
    inputs: summary.inputs.map((input) => ({
      coinbase: input.coinbase,
      coinbaseHex: input.coinbaseHex || null,
      txid: input.txid || null,
      vout: input.vout ?? null,
      address: input.address,
      value: decimal(input.value),
      asset: input.asset ? { name: input.asset.name, amount: decimal(input.asset.amount) } : null,
    })),
    outputs: summary.outputs.map((output, index) => {
      const spent = spentList[index];
      return {
        n: output.n,
        type: output.type,
        address: output.address,
        value: decimal(output.value),
        asset: output.asset
          ? { name: output.asset.name, amount: decimal(output.asset.amount), message: output.asset.message || null }
          : null,
        data: output.data,
        dataText: output.data ? payloadText(output.data) : null,
        change: output.change,
        burn: !!output.address && isBurnAddress(output.address),
        spent: spent && spent.spent ? { txid: spent.spent.txid, index: spent.spent.index, height: spent.spent.height ?? null } : null,
        spentKnown: !!(spent && spent.known),
      };
    }),
    raw: tx,
  };
}

/* ---------------------------------------------------------------------------
 * Mempool and recent activity
 * ------------------------------------------------------------------------ */

const mempoolCache = createCache({ ttl: 5000, max: 2 });
function getMempoolEntries() {
  return mempoolCache.get("entries", async () => {
    const entries = await blockchain.getRawMempoolVerbose();
    return Object.entries(entries || {})
      .map(([txid, entry]) => ({
        txid,
        time: entry.time || 0,
        size: entry.size || entry.vsize || 0,
        //"fee" in XNA on older nodes, "fees.base" on newer ones
        fee: toSatoshis(entry.fees && entry.fees.base !== undefined ? entry.fees.base : entry.fee),
      }))
      .sort((a, b) => b.time - a.time);
  });
}

export async function getMempool({ limit }) {
  const max = clampInt(limit, 1, 200, 50);
  const [info, entries, tip] = await Promise.all([blockchain.getMempoolInfo(), getMempoolEntries(), getTip()]);
  const items = await mapLimit(entries.slice(0, max), 6, async (entry) => {
    try {
      return txListItem(await getTx(entry.txid), tip, { firstSeen: entry.time });
    } catch (e) {
      //Mined or dropped between the two calls
      return null;
    }
  });
  return { size: info.size, bytes: info.bytes, items: items.filter(Boolean) };
}

const recentCache = createCache({ ttl: 5000, max: 4 });
export function getRecentTransactions() {
  return recentCache.get("recent", async () => {
    const [entries, tip] = await Promise.all([getMempoolEntries(), getTip()]);
    const pending = await mapLimit(entries.slice(0, 5), 5, async (entry) => {
      try {
        return txListItem(await getTx(entry.txid), tip, { firstSeen: entry.time });
      } catch (e) {
        return null;
      }
    });
    //Newest confirmed transactions, walking back from the tip; coinbases last
    const confirmed = [];
    let hash = tip.hash;
    for (let i = 0; i < 20 && hash && confirmed.length < 10; i++) {
      const block = await getBlockByHash(hash);
      const txids = (block.tx || []).slice(1).concat((block.tx || []).slice(0, 1));
      for (const txid of txids.slice(0, 10 - confirmed.length)) confirmed.push(txid);
      hash = block.previousblockhash;
    }
    const confirmedItems = await mapLimit(confirmed, 6, async (txid) => txListItem(await getTx(txid), tip));
    return { pending: pending.filter(Boolean), confirmed: confirmedItems };
  });
}

/* ---------------------------------------------------------------------------
 * The chain as a strip of blocks (home page), like mempool.space
 * ------------------------------------------------------------------------ */

//Fee rates are spread like this in a block: the median and both ends
function feeRateSpread(rates) {
  if (rates.length === 0) return null;
  const sorted = [...rates].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
  return { median, min: sorted[0], max: sorted[sorted.length - 1] };
}

//What a block holds, by kind, for the mosaic of its cube
function kindGroup(kind) {
  if (kind === "coinbase") return "coinbase";
  if (kind === "payment") return "payment";
  if (kind === "privacy") return "privacy";
  if (kind === "data") return "other";
  return "asset";
}

//Above this many transactions a block's fees are not added up for the strip
const STRIP_FEE_LIMIT = 50;
//A block's contents never change: one summary per hash
const stripBlockCache = createCache({ max: 300 });
function stripBlock(hash) {
  return stripBlockCache.get(hash, async () => {
    const block = await blockchain.getBlock(hash, 2);
    const txs = block.tx || [];
    const mix = { coinbase: 0, payment: 0, asset: 0, privacy: 0, other: 0 };
    let assetCreated = false;
    let privacy = false;
    for (const tx of txs) {
      const { kind } = summarizeTransaction(tx);
      mix[kindGroup(kind)]++;
      if (kind === "asset-issue") assetCreated = true;
      if (kind === "privacy") privacy = true;
    }
    const coinbase = txs[0];
    const reward = coinbase ? coinbase.vout.reduce((sum, output) => sum + toSatoshis(output.value), 0n) : 0n;

    //Fees need the value of every input, which only getrawtransaction carries
    let fees = null;
    let feeRate = null;
    if (txs.length - 1 <= STRIP_FEE_LIMIT) {
      const others = await mapLimit(txs.slice(1), 6, (tx) => getTx(tx.txid));
      const summaries = others.map((tx) => summarizeTransaction(tx));
      if (summaries.every((summary) => summary.fee !== null)) {
        fees = summaries.reduce((sum, summary) => sum + summary.fee, 0n);
        feeRate = feeRateSpread(summaries.map((summary) => summary.feeRate).filter((rate) => rate !== null));
      }
    }
    return {
      height: block.height,
      hash: block.hash,
      time: block.time,
      txCount: txs.length,
      size: block.size,
      weight: block.weight,
      mix,
      assetCreated,
      privacy,
      fees: decimal(fees),
      feeRate,
      reward: decimal(reward),
    };
  });
}

const stripCache = createCache({ ttl: 5000, max: 20 });
export async function getChainStrip({ count }) {
  const wanted = clampInt(count, 1, 15, 10);
  const tip = await getTip();
  return stripCache.get(tip.hash + ":" + wanted, async () => {
    const heights = [];
    for (let h = tip.height; h > tip.height - wanted && h >= 0; h--) heights.push(h);
    const [blocks, entries, stats] = await Promise.all([
      mapLimit(heights, 4, async (height) => {
        const hash = height === tip.height ? tip.hash : await hashAtHeight(height, tip.height);
        return stripBlock(hash);
      }),
      getMempoolEntries(),
      getStats().catch(() => null),
    ]);
    const rates = entries.filter((entry) => entry.size > 0).map((entry) => Number(entry.fee) / entry.size);
    return {
      tip: { height: tip.height, time: tip.time },
      avgBlockTime: stats ? stats.avgBlockTime : null,
      mempool: {
        count: entries.length,
        bytes: entries.reduce((sum, entry) => sum + entry.size, 0),
        fees: decimal(entries.reduce((sum, entry) => sum + entry.fee, 0n)),
        feeRate: feeRateSpread(rates),
      },
      blocks,
    };
  });
}

/* ---------------------------------------------------------------------------
 * Network stats and price
 * ------------------------------------------------------------------------ */

const priceCache = createCache({ ttl: 60000, max: 1 });
async function getPrice(chain) {
  if (CONFIG.price_lookup_enabled === false || chain !== "main") return null;
  return priceCache.get("usd", async () => {
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=neurai&vs_currencies=usd&include_24hr_change=true",
        { signal: AbortSignal.timeout(5000) }
      );
      const json = await response.json();
      const usd = json && json.neurai && json.neurai.usd;
      if (typeof usd !== "number") return null;
      const change = json.neurai.usd_24h_change;
      return { usd, change24h: typeof change === "number" ? change : null };
    } catch (e) {
      return null;
    }
  });
}
export async function getPriceForChain() {
  return getPrice(await getChain());
}

/*
  Coins that exist, straight from the node: gettxoutsetinfo adds up the UTXO
  set. It scans the whole set and makes the node flush its cache, so it is
  asked at most once per new block, in the background, one call at a time;
  pages show the last answer and never wait for it. Public RPCs refuse it
  ("Not in whitelist"): then it is not asked again for an hour, and the
  schedule below is all there is. docker-compose.yml grants it to the
  explorer's key on the stack's own wallet-services (PROXY_HTTP_CLIENTS).
*/
const circulation = { hash: null, amount: null, height: null, pending: false, retryAt: 0 };
function refreshCirculation(tipHash) {
  if (circulation.pending || circulation.hash === tipHash || Date.now() < circulation.retryAt) return;
  circulation.pending = true;
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("gettxoutsetinfo took more than 3 minutes")), 180000);
  });
  Promise.race([blockchain.getTxOutSetInfo(), timeout])
    .then((info) => {
      circulation.hash = tipHash;
      circulation.amount = toSatoshis(info.total_amount);
      circulation.height = info.height ?? null;
    })
    .catch((e) => {
      const message = rpcErrorMessage(e);
      const refused = /whitelist|not supported|method not found/i.test(message);
      circulation.retryAt = Date.now() + (refused ? 3600000 : 300000);
      if (!refused) console.log("gettxoutsetinfo failed:", message);
    })
    .finally(() => {
      clearTimeout(timer);
      circulation.pending = false;
    });
}

/*
  Coins mined so far, from the emission schedule (shared/emission.js). The
  schedule is checked against the newest block: if its coinbase does not pay
  subsidy plus fees, the node follows rules this explorer does not know yet
  (a new fork), and no number is better than a wrong one.
*/
async function scheduleSupply(chain, height, tip) {
  const params = EMISSION[chain];
  if (!params) return null;
  const block = await stripBlock(tip.hash);
  if (block.fees !== null) {
    const subsidy = toSatoshis(block.reward) - toSatoshis(block.fees);
    if (subsidy !== blockSubsidy(block.height, params)) {
      console.log(`Emission schedule does not match block ${block.height}: coinbase subsidy ${subsidy}`);
      return null;
    }
  }
  return { mined: totalMined(height, params), max: maxSupply(params), subsidy: blockSubsidy(height, params) };
}

async function getSupply(chain, height) {
  const tip = await getTip();
  refreshCirculation(tip.hash);
  const schedule = await scheduleSupply(chain, height, tip).catch(() => null);
  const circulating = circulation.amount !== null ? { amount: decimal(circulation.amount), height: circulation.height } : null;
  if (!schedule && !circulating) return null;
  const max = schedule ? schedule.max : null;
  const shown = circulation.amount !== null ? circulation.amount : schedule ? schedule.mined : null;
  return {
    mined: schedule ? decimal(schedule.mined) : null,
    max: decimal(max),
    share: max && shown !== null ? Number(shown) / Number(max) : null,
    subsidy: schedule ? decimal(schedule.subsidy) : null,
    circulating,
  };
}

const statsCache = createCache({ ttl: 10000, max: 1 });
export function getStats() {
  return statsCache.get("stats", async () => {
    const info = await blockchain.getBlockchainInfo();
    const quiet = (promise) => promise.catch(() => null);
    const recent = await quiet(blockchain.getChainTxStats(Math.min(100, Math.max(1, info.blocks - 1))));
    const avgBlockTime =
      recent && toNumber(recent.window_block_count)
        ? toNumber(recent.window_interval) / toNumber(recent.window_block_count)
        : null;
    const blocksPerDay = avgBlockTime ? Math.round(86400 / avgBlockTime) : 1440;
    const [hashrate, mempool, day, price] = await Promise.all([
      quiet(blockchain.getNetworkHashPs()),
      quiet(blockchain.getMempoolInfo()),
      quiet(blockchain.getChainTxStats(Math.min(blocksPerDay, Math.max(1, info.blocks - 1)))),
      getPrice(info.chain),
    ]);
    return {
      chain: info.chain,
      height: info.blocks,
      supply: await getSupply(info.chain, info.blocks).catch(() => null),
      headers: info.headers,
      bestBlockHash: info.bestblockhash,
      difficulty: toNumber(info.difficulty),
      hashrate: toNumber(hashrate),
      avgBlockTime,
      txRate: day ? toNumber(day.txrate) : null,
      txCount: recent ? toNumber(recent.txcount) : null,
      mempool: mempool ? { size: mempool.size, bytes: mempool.bytes } : null,
      price,
    };
  });
}

/* ---------------------------------------------------------------------------
 * Addresses
 * ------------------------------------------------------------------------ */

const deltasCache = createCache({ ttl: 15000, max: 200 });
function getDeltas(address) {
  return deltasCache.get(address, () => blockchain.getAddressDeltas(address));
}
const headerTimeCache = createCache({ max: 50000 });
function blockTime(height) {
  return headerTimeCache.get(String(height), async () => (await blockchain.getBlockHeaderByHeight(height)).time);
}

async function requireAddress(address) {
  const text = String(address || "").trim();
  let valid = false;
  try {
    valid = await blockchain.validateAddress(text);
  } catch (e) {}
  if (!valid) throw new BadRequestError(text + " is not a valid Neurai address on this network.");
  return text;
}

//Deltas grouped by transaction: one row per transaction, one amount per asset
function groupDeltas(deltas) {
  const byTx = new Map();
  for (const delta of deltas || []) {
    let row = byTx.get(delta.txid);
    if (!row) {
      row = { txid: delta.txid, height: delta.height, index: delta.blockindex || 0, assets: new Map() };
      byTx.set(delta.txid, row);
    }
    const name = delta.assetName || "XNA";
    row.assets.set(name, (row.assets.get(name) || 0n) + rawSatoshis(delta.satoshis));
    if ((delta.blockindex || 0) > row.index) row.index = delta.blockindex;
  }
  return [...byTx.values()].sort((a, b) => b.height - a.height || b.index - a.index);
}

export async function getAddressSummary(address) {
  const text = await requireAddress(address);
  const [balances, deltas, mempool] = await Promise.all([
    blockchain.getAddressBalances(text),
    getDeltas(text),
    blockchain.getAddressMempool(text).catch(() => []),
  ]);
  const xna = (balances || []).find((b) => b.assetName === "XNA") || { balance: 0, received: 0 };
  const balance = rawSatoshis(xna.balance);
  const received = rawSatoshis(xna.received);
  const rows = groupDeltas(deltas);
  const first = rows.length ? rows[rows.length - 1].height : null;
  const last = rows.length ? rows[0].height : null;
  const [firstTime, lastTime] = await Promise.all([
    first !== null ? blockTime(first).catch(() => null) : null,
    last !== null ? blockTime(last).catch(() => null) : null,
  ]);

  const pending = {};
  for (const delta of mempool || []) {
    const name = delta.assetName || "XNA";
    pending[name] = (pending[name] || 0n) + rawSatoshis(delta.satoshis);
  }

  const family = addressFamily(text);
  return {
    address: text,
    family,
    familyLabel: ADDRESS_FAMILY_LABELS[family],
    burn: isBurnAddress(text),
    balance: decimal(balance),
    received: decimal(received),
    sent: decimal(received - balance),
    assets: (balances || [])
      .filter((b) => b.assetName !== "XNA" && rawSatoshis(b.balance) !== 0n)
      .map((b) => ({ name: b.assetName, type: assetType(b.assetName), balance: decimal(rawSatoshis(b.balance)) }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    pending: Object.entries(pending)
      .filter(([, amount]) => amount !== 0n)
      .map(([asset, amount]) => ({ asset, amount: decimal(amount) })),
    txCount: rows.length,
    first: first !== null ? { height: first, time: firstTime } : null,
    last: last !== null ? { height: last, time: lastTime } : null,
  };
}

//At most this many points: enough for the shape, small enough to send
const CHART_POINTS = 120;
function balanceChart(rows) {
  const ascending = rows.filter((row) => row.assets.has("XNA")).reverse();
  if (ascending.length < 2) return [];
  let balance = 0n;
  const points = ascending.map((row) => {
    balance += row.assets.get("XNA");
    return { height: row.height, balance };
  });
  const step = Math.max(1, Math.ceil(points.length / CHART_POINTS));
  const kept = points.filter((_, index) => index % step === step - 1 || index === points.length - 1);
  return kept.map((point) => ({ height: point.height, balance: decimal(point.balance) }));
}

export async function getAddressHistory(address, { page: pageNumber, size, filter }) {
  const text = await requireAddress(address);
  const [deltas, mempool] = await Promise.all([
    getDeltas(text),
    blockchain.getAddressMempool(text).catch(() => []),
  ]);
  const rows = groupDeltas(deltas);
  const mode = filter === "xna" || filter === "assets" ? filter : "all";
  const filtered = rows.filter((row) => {
    if (mode === "xna") return (row.assets.get("XNA") || 0n) !== 0n;
    if (mode === "assets") return [...row.assets.keys()].some((name) => name !== "XNA");
    return true;
  });
  const paged = page(filtered, clampInt(pageNumber, 1, 1e9, 1), clampInt(size, 1, 100, 25));
  const times = await mapLimit(paged.slice, 6, (row) => blockTime(row.height).catch(() => null));

  const asList = (assets) =>
    [...assets.entries()]
      .filter(([, amount]) => amount !== 0n)
      .map(([name, amount]) => ({ asset: name, amount: decimal(amount) }))
      .sort((a, b) => (a.asset === "XNA" ? -1 : b.asset === "XNA" ? 1 : a.asset.localeCompare(b.asset)));

  const pendingByTx = new Map();
  for (const delta of mempool || []) {
    let row = pendingByTx.get(delta.txid);
    if (!row) {
      row = { txid: delta.txid, time: delta.timestamp || null, assets: new Map() };
      pendingByTx.set(delta.txid, row);
    }
    const name = delta.assetName || "XNA";
    row.assets.set(name, (row.assets.get(name) || 0n) + rawSatoshis(delta.satoshis));
  }

  return {
    total: paged.total,
    page: paged.page,
    size: paged.size,
    pages: paged.pages,
    filter: mode,
    pending:
      paged.page === 1
        ? [...pendingByTx.values()].map((row) => ({ txid: row.txid, time: row.time, assets: asList(row.assets) }))
        : [],
    items: paged.slice.map((row, index) => ({
      txid: row.txid,
      height: row.height,
      time: times[index],
      assets: asList(row.assets),
    })),
    chart: paged.page === 1 && mode === "all" ? balanceChart(rows) : null,
  };
}

const utxoCache = createCache({ ttl: 15000, max: 200 });
export async function getAddressUtxos(address, { page: pageNumber, size }) {
  const text = await requireAddress(address);
  const [utxos, tip] = await Promise.all([
    utxoCache.get(text, () => blockchain.getAddressUTXOs(text)),
    getTip(),
  ]);
  const sorted = [...(utxos || [])].sort((a, b) => (b.height || 0) - (a.height || 0));
  const paged = page(sorted, clampInt(pageNumber, 1, 1e9, 1), clampInt(size, 1, 100, 25));
  return {
    total: paged.total,
    page: paged.page,
    size: paged.size,
    pages: paged.pages,
    items: paged.slice.map((utxo) => ({
      txid: utxo.txid,
      index: utxo.outputIndex,
      asset: utxo.assetName || "XNA",
      amount: decimal(rawSatoshis(utxo.satoshis)),
      height: utxo.height ?? null,
      confirmations: utxo.height ? tip.height - utxo.height + 1 : 0,
    })),
  };
}

/* ---------------------------------------------------------------------------
 * Assets
 * ------------------------------------------------------------------------ */

const assetListCache = createCache({ ttl: 60000, max: 1 });
//A proxy may cap how many assets one call returns: ask page by page until one comes back empty
const ASSET_PAGE = 1000;
async function listAllAssets() {
  const all = {};
  for (let start = 0, round = 0; round < 1000; round++) {
    const page = (await blockchain.listAssetsVerbose("*", ASSET_PAGE, start)) || {};
    const names = Object.keys(page);
    if (names.length === 0) break;
    Object.assign(all, page);
    start += names.length;
  }
  return all;
}
function getAllAssets() {
  return assetListCache.get("all", async () => {
    const listing = await listAllAssets();
    return Object.values(listing || {}).map((asset) => ({
      name: asset.name,
      type: assetType(asset.name),
      amount: decimal(toSatoshis(asset.amount)),
      units: asset.units,
      reissuable: !!asset.reissuable,
      hasIpfs: !!asset.has_ipfs,
      ipfsHash: asset.ipfs_hash || null,
      height: asset.block_height ?? null,
      blockhash: asset.blockhash || null,
    }));
  });
}

const holderCache = createCache({ ttl: 600000, max: 2000 });
//Every holder with its amount, largest first
function getHolders(name) {
  return holderCache.get(name, async () => {
    const holders = await blockchain.getAddressesByAsset(name);
    return Object.entries(holders || {})
      .map(([address, amount]) => ({ address, amount: toSatoshis(amount) }))
      .sort((a, b) => (b.amount > a.amount ? 1 : b.amount < a.amount ? -1 : a.address.localeCompare(b.address)));
  });
}

export async function getAssetList({ page: pageNumber, size, q, type, sort }) {
  const all = await getAllAssets();
  const query = String(q || "").trim().toUpperCase();
  const matching = query ? all.filter((asset) => asset.name.toUpperCase().includes(query)) : all;
  const counts = { all: matching.length };
  for (const asset of matching) counts[asset.type] = (counts[asset.type] || 0) + 1;
  const ofType = type && type !== "all" ? matching.filter((asset) => asset.type === type) : matching;
  const sorted = [...ofType].sort((a, b) => {
    if (sort === "newest") return (b.height || 0) - (a.height || 0) || a.name.localeCompare(b.name);
    //Names starting with what was typed come first
    if (query) {
      const ap = a.name.toUpperCase().startsWith(query) ? 0 : 1;
      const bp = b.name.toUpperCase().startsWith(query) ? 0 : 1;
      if (ap !== bp) return ap - bp;
    }
    return a.name.localeCompare(b.name);
  });
  const paged = page(sorted, clampInt(pageNumber, 1, 1e9, 1), clampInt(size, 1, 100, 24));
  const items = await mapLimit(paged.slice, 4, async (asset) => {
    let holders = null;
    try {
      holders = (await getHolders(asset.name)).length;
    } catch (e) {}
    return { ...asset, typeLabel: ASSET_TYPE_LABELS[asset.type], holders };
  });
  return { total: paged.total, page: paged.page, size: paged.size, pages: paged.pages, counts, items };
}

const issueTxCache = createCache({ max: 2000 });
//The transaction that created the asset, found in its issuance block
function findIssueTx(name, blockhash) {
  return issueTxCache.get(name, async () => {
    if (!blockhash) return null;
    const block = await blockchain.getBlock(blockhash, 2);
    for (const tx of block.tx || []) {
      for (const output of tx.vout || []) {
        const spk = output.scriptPubKey || {};
        if (spk.type === "new_asset" && spk.asset && spk.asset.name === name) return tx.txid;
      }
    }
    return null;
  });
}

export async function getAssetDetail(name) {
  const text = String(name || "").trim();
  let meta = null;
  try {
    meta = await blockchain.getAssetData(text);
  } catch (e) {}
  if (!meta || !meta.name) {
    const found = await blockchain.findAssetName(text);
    if (!found) throw new NotFoundError("No asset named " + text + ".");
    meta = await blockchain.getAssetData(found);
  }
  const assetName = meta.name;
  const type = assetType(assetName);
  const listing = (await getAllAssets()).find((asset) => asset.name === assetName) || null;

  /*
    Parts that could not be read: the RPC service may refuse a burst of these
    asset reads (wallet-services answers 503 to protect a v1.0.6 node), or the
    node may be unreachable. The page names them and offers a retry, instead
    of showing an empty list as if there were none.
  */
  const unavailable = [];
  const missing = (part) => () => {
    unavailable.push(part);
    return null;
  };

  let owner = null;
  if (type !== "owner" && type !== "unique" && type !== "qualifier") {
    try {
      const owners = await getHolders(assetName + "!");
      if (owners.length) owner = { address: owners[0].address, amount: decimal(owners[0].amount) };
    } catch (e) {
      //Only "not a valid asset name" means there is no owner token (e.g.
      //"$TOKEN!"); anything else, an RPC failure or a node without
      //-assetindex, means the owner could not be read
      if (!blockchain.isInvalidAssetName(e)) unavailable.push("owner");
    }
  }
  const [holders, issueTxid, subAssets, uniques] = await Promise.all([
    getHolders(assetName).catch(missing("holders")),
    findIssueTx(assetName, listing && listing.blockhash).catch(missing("issueTx")),
    blockchain.listAssetNames(assetName + "/*").catch(missing("subAssets")),
    blockchain.listAssetNames(assetName + "#*").catch(missing("uniques")),
  ]);

  return {
    name: assetName,
    type,
    typeLabel: ASSET_TYPE_LABELS[type],
    amount: decimal(toSatoshis(meta.amount)),
    units: meta.units,
    reissuable: !!meta.reissuable,
    hasIpfs: !!meta.has_ipfs,
    ipfsHash: meta.ipfs_hash || null,
    height: listing ? listing.height : null,
    blockhash: listing ? listing.blockhash : null,
    issueTxid,
    owner,
    holderCount: holders ? holders.length : null,
    parent: parentAsset(assetName),
    //null: could not be read (listed in `unavailable`)
    subAssets: subAssets === null ? null : (Array.isArray(subAssets) ? subAssets : []).slice(0, 200),
    uniques: uniques === null ? null : (Array.isArray(uniques) ? uniques : []).slice(0, 200),
    unavailable,
    raw: meta,
  };
}

export async function getAssetHolders(name, { page: pageNumber, size }) {
  const detail = await getAssetDetail(name);
  const holders = await getHolders(detail.name);
  const supply = toSatoshis(detail.amount);
  const paged = page(holders, clampInt(pageNumber, 1, 1e9, 1), clampInt(size, 1, 100, 25));
  const offset = (paged.page - 1) * paged.size;
  return {
    total: paged.total,
    page: paged.page,
    size: paged.size,
    pages: paged.pages,
    supply: detail.amount,
    owner: detail.owner,
    items: paged.slice.map((holder, index) => ({
      rank: offset + index + 1,
      address: holder.address,
      amount: decimal(holder.amount),
      //Share of the supply, for the bar and a percentage: a float is precise enough
      share: supply > 0n ? Number(holder.amount) / Number(supply) : null,
    })),
  };
}

export { COIN };
