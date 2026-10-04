/*
  Adds methods to neurai-rpc-proxy's whitelist without editing its source.

  Loaded before the proxy with `node -r`, so it pushes into the same array the
  proxy checks (whitelist.js exports it and isWhitelisted reads it). Names come
  from PROXY_EXTRA_METHODS, comma separated.

  Only read-only methods listed here can be added: a typo or a pasted list must
  never open stop, dumpprivkey or a wallet call through this door. They are
  left out of the public proxy because they are slow, not because they are
  unsafe; the proxy caches each of them per block when it has one node.
*/
const ALLOWED = [
  //Scans the whole UTXO set: the coins that exist, for the explorer's supply
  "gettxoutsetinfo",
  "getmininginfo",
  "getblockstats",
  "getconnectioncount",
  "getnettotals",
];

//The proxy runs from its own folder (/app in the image), where whitelist.js lives
const { whitelist } = require(require("path").resolve(process.cwd(), "whitelist.js"));

const wanted = String(process.env.PROXY_EXTRA_METHODS || "")
  .split(",")
  .map((name) => name.trim())
  .filter(Boolean);

for (const method of wanted) {
  if (!ALLOWED.includes(method)) {
    console.log(`[extra-whitelist] ${method} refused: only ${ALLOWED.join(", ")} can be added`);
    continue;
  }
  if (!whitelist.includes(method)) {
    whitelist.push(method);
    console.log(`[extra-whitelist] ${method} whitelisted`);
  }
}
