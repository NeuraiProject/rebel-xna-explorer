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
export function getBlock(hash) {
  return Reader.getBlockByHash(hash);
}
export async function getTransaction(id) {
  return Reader.getTransaction(id);
}

export async function getCoinsInCirculation() {
  return rpc(methods.gettxoutsetinfo, []);
}
export async function getAddressBalance(address) {
  const balance = await Reader.getNeuraiBalance(address);
  balance.assets = await Reader.getAssetBalance(address);
  return balance;
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
export function getBlockByHeight(height) {
  return Reader.getBlockByHeight(height);
}
export function getBestBlockHash() {
  return Reader.getBestBlockHash();
}

export async function getAssets() {
  return Reader.getAllAssets();
}
export async function getAddressesByAsset(name) {
  const addresses = await rpc(methods.listaddressesbyasset, [name]);
  //The node answers invalid asset names (e.g. "#QUALIFIER!") with a string
  if (typeof addresses === "string") {
    throw new Error(addresses);
  }
  return addresses;
}
export async function getAddressDeltas(address) {
  return Reader.getAddressDeltas(address);
}
export async function getRawMempool() {
  return Reader.getMempool();
}

export default {
  getAddressBalance,
  getAddressDeltas,
  getAddressesByAsset,
  getAddressUTXOs,
  getAssetData,
  getAssets,
  getBlock,
  getBlockByHeight,
  getBestBlockHash,
  getCoinsInCirculation,
  getRawMempool,
  getTransaction,
  getType,
};
