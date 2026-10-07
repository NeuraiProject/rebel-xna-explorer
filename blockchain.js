import { getRPC, methods } from "@neuraiproject/neurai-rpc";
import { createReader } from "@neuraiproject/neurai-reader";

/*

All blockchain operations to into this file

 */

import getConfig from "./getConfig.js";
const CONFIG = getConfig();
const rpc = getRPC(
  CONFIG.neurai_username,
  CONFIG.neurai_password,
  CONFIG.neurai_url
);

const Reader = createReader({
  url: CONFIG.neurai_url,
  username: CONFIG.neurai_username,
  password: CONFIG.neurai_password,
});

//RPC errors are plain objects, not Error instances, and the node's message may
//sit a level or two down: {error: {message}} from wallet-services, one more
//level from the retired neurai-rpc-proxy
export function rpcErrorMessage(e, depth = 0) {
  if (!e) return "Unknown error";
  if (typeof e === "string") return e;
  if (depth < 4 && e.error && typeof e.error === "object") {
    const inner = rpcErrorMessage(e.error, depth + 1);
    if (inner !== "Unknown error") return inner;
  }
  if (typeof e.message === "string" && e.message) return e.message;
  if (typeof e.error === "string" && e.error) return e.error;
  if (typeof e.description === "string" && e.description) return e.description;
  return depth === 0 ? String(e) : "Unknown error";
}

export async function getAddressUTXOs(address) {
  //Fetch UTXOs for XNA and for Assets
  try {
    const [xna, assets] = await Promise.all([
      //GET XNA
      rpc(methods.getaddressutxos, [address]),
      //GET ASSETS
      rpc(methods.getaddressutxos, [
        {
          addresses: [address],
          assetName: "*",
        },
      ]),
    ]);
    return [...xna, ...assets];
  } catch (e) {
    throw new Error("Could not get UTXOs", { cause: e });
  }
}
export function getAssetData(name) {
  return Reader.getAsset(name);
}
//verbosity 1: header fields plus the list of txids
export function getBlock(hash, verbosity = 1) {
  return rpc(methods.getblock, [hash, verbosity]);
}
export function getBlockHash(height) {
  return rpc(methods.getblockhash, [height]);
}
export async function getTransaction(id) {
  return rpc(methods.getrawtransaction, [id, 1]);
}

export async function getAddressBalance(address) {
  const balance = await Reader.getNeuraiBalance(address);
  balance.assets = await Reader.getAssetBalance(address);
  return balance;
}
//XNA and every asset in one call: [{assetName, balance, received}], satoshis
export function getAddressBalances(address) {
  return rpc(methods.getaddressbalance, [{ addresses: [address] }, true]);
}
export function getAddressMempool(address) {
  return rpc(methods.getaddressmempool, [{ addresses: [address] }]);
}
export async function validateAddress(address) {
  const result = await rpc(methods.validateaddress, [address]);
  return !!(result && result.isvalid);
}
export async function getType(value) {
  //Determine if id is block has, trans id or address

  if (!value) {
    return null;
  }
  if (value.length === 64) {
    //block or transaction
    try {
      const block = await rpc(methods.getblock, [value]);
      if (block) {
        return "BLOCK";
      }
    } catch (e) {}

    try {
      const verbose = 1;
      const transaction = await rpc(methods.getrawtransaction, [
        value,
        verbose,
      ]);

      if (transaction) {
        return "TRANSACTION";
      }
    } catch (e) {}
  } else {
    //probably an address
    try {
      const valid = await rpc(methods.validateaddress, [value]);
      if (valid && valid.isvalid === true) {
        return "ADDRESS";
      }
    } catch (e) {}
  }

  //Check if block height
  const isHeight = /^[0-9]+$/.test(value);

  if (isHeight) {
    try {
      const block = await getBlockByHeight(parseInt(value, 10));

      if (block) {
        return "BLOCK";
      }
    } catch (e) {}
  }

  return "UNKNOWN";
}
export async function getBlockByHeight(height, verbosity = 1) {
  const hash = await getBlockHash(height);
  return getBlock(hash, verbosity);
}
//Header only, enough for the block time without fetching every transaction
export async function getBlockHeaderByHeight(height) {
  const hash = await rpc(methods.getblockhash, [height]);
  return rpc(methods.getblockheader, [hash]);
}
export function getBlockchainInfo() {
  return rpc(methods.getblockchaininfo, []);
}
//"main", "test" or "regtest"
export async function getChain() {
  const info = await getBlockchainInfo();
  return info.chain;
}
//Estimated hashes per second over the last blocks
export function getNetworkHashPs() {
  return rpc(methods.getnetworkhashps, []);
}
//Coins in the UTXO set. Slow (it scans the whole set): public proxies refuse it
export function getTxOutSetInfo() {
  return rpc(methods.gettxoutsetinfo, []);
}
export function getMempoolInfo() {
  return rpc(methods.getmempoolinfo, []);
}
//Transaction counts over the last nblocks blocks
export function getChainTxStats(nblocks) {
  return rpc(methods.getchaintxstats, nblocks ? [nblocks] : []);
}
//{txid: {size, fee, time, height, …}}
export function getRawMempoolVerbose() {
  return rpc(methods.getrawmempool, [true]);
}
export function getMempoolEntry(txid) {
  return rpc(methods.getmempoolentry, [txid]);
}
//Where an output was spent, null when it is still unspent
export async function getSpentInfo(txid, index) {
  try {
    return await rpc(methods.getspentinfo, [{ txid, index }]);
  } catch (e) {
    if (/Unable to get spent info/i.test(rpcErrorMessage(e))) {
      return null;
    }
    throw e;
  }
}
//Asset names are upper case but users type them in any case
export async function findAssetName(value) {
  const candidates = [...new Set([value, value.toUpperCase()])];
  for (const name of candidates) {
    try {
      const asset = await Reader.getAsset(name);
      if (asset && asset.name) {
        return asset.name;
      }
    } catch (e) {}
  }
  return null;
}
export function getBestBlockHash() {
  return Reader.getBestBlockHash();
}

export async function getAssets() {
  return Reader.getAllAssets();
}
//{name: {name, amount, units, reissuable, has_ipfs, ipfs_hash?, block_height, blockhash}}
export function listAssetsVerbose(pattern = "*", count, start) {
  const params = count === undefined ? [pattern, true] : [pattern, true, count, start || 0];
  return rpc(methods.listassets, params);
}
export function listAssetNames(pattern) {
  return rpc(methods.listassets, [pattern, false]);
}
export async function getAddressesByAsset(name) {
  const addresses = await rpc(methods.listaddressesbyasset, [name]);
  //The node answers some calls with a string instead of an error: invalid
  //asset names (e.g. "#QUALIFIER!") and a node without -assetindex
  if (typeof addresses === "string") {
    throw new Error(addresses);
  }
  return addresses;
}
//The node's answer for a name that cannot exist, such as the owner token of a
//restricted asset ("$TOKEN!"). Any other error is a failed read.
const INVALID_ASSET_NAME = "_Not a valid asset name";
export function isInvalidAssetName(e) {
  return e instanceof Error && e.message === INVALID_ASSET_NAME;
}
export async function getAddressDeltas(address) {
  return Reader.getAddressDeltas(address);
}
export async function getRawMempool() {
  return Reader.getMempool();
}

export default {
  findAssetName,
  getAddressBalance,
  getAddressBalances,
  getAddressDeltas,
  getAddressesByAsset,
  getAddressMempool,
  getAddressUTXOs,
  getAssetData,
  getAssets,
  getBestBlockHash,
  getBlock,
  getBlockByHeight,
  getBlockchainInfo,
  getBlockHash,
  getBlockHeaderByHeight,
  getChain,
  getChainTxStats,
  getMempoolEntry,
  getMempoolInfo,
  getNetworkHashPs,
  getRawMempool,
  getRawMempoolVerbose,
  getSpentInfo,
  getTransaction,
  getTxOutSetInfo,
  getType,
  isInvalidAssetName,
  listAssetNames,
  listAssetsVerbose,
  validateAddress,
};
