/*
  Reading a transaction the way a person would: what kind it is, what moved,
  what it cost. Pure functions over the node's verbose transaction, so the
  server can summarize and the tests can run without a node.
*/
import { toSatoshis, rawSatoshis } from "./amount.js";
import { assetType } from "./assets.js";
import { isBurnAddress } from "./addresses.js";

/**
 * @typedef {Object} AssetAmount
 * @property {string} name
 * @property {bigint} amount satoshis of the asset (assets also have 8 decimals on the wire)
 * @property {string} [message] IPFS hash or txid attached to a transfer
 */

/**
 * @typedef {Object} TxInput
 * @property {boolean} coinbase
 * @property {string} [coinbaseHex]
 * @property {string} [txid] transaction that created the spent output
 * @property {number} [vout] index of the spent output
 * @property {string | null} address
 * @property {bigint | null} value XNA satoshis, null when the node did not say
 * @property {AssetAmount | null} asset
 * @property {string[] | null} witness
 */

/**
 * @typedef {Object} TxOutput
 * @property {number} n
 * @property {string} type scriptPubKey type, e.g. pubkeyhash, transfer_asset, nulldata
 * @property {string | null} address
 * @property {bigint} value XNA satoshis
 * @property {AssetAmount | null} asset
 * @property {string | null} data payload of an OP_RETURN, hex
 * @property {string} hex scriptPubKey hex
 * @property {boolean} change pays back to an address that funded the transaction
 */

/**
 * @typedef {"coinbase" | "payment" | "asset-transfer" | "asset-issue" | "asset-reissue" | "qualifier" | "depin" | "privacy" | "data"} TxKind
 */

/** @type {Record<TxKind, string>} */
export const TX_KIND_LABELS = {
  coinbase: "Coinbase",
  payment: "Payment",
  "asset-transfer": "Asset transfer",
  "asset-issue": "Asset issue",
  "asset-reissue": "Asset reissue",
  qualifier: "Qualifier",
  depin: "DePIN transfer",
  privacy: "Privacy pool",
  data: "Data",
};

/*
  Privacy pools (neurai-privacy). Every pool transaction carries the pool's
  state in output 0: the unique token NAME#POOL, amount 1, with the 32 byte
  state digest as its message, locked by an AuthScript (51 20 …). Input 0
  spends the previous state with a witness that starts with 0x10; the pool's
  creation has no witness there. The reserve (the pooled coins) sits in
  output 1 and is spent by input 1 with the witness ["00", guard].

  C6 pools put the operation in the second witness item: 02|03, then a form
  byte. C4 and C5 pools have 7 witness items for a withdrawal and 8 for a
  deposit or a transfer, told apart by what the reserve did.
*/

/** @typedef {"create" | "deposit" | "withdrawal" | "transfer" | "join" | "operation"} PoolAction */

/** @type {Record<PoolAction, string>} */
export const POOL_ACTION_LABELS = {
  create: "Privacy pool created",
  deposit: "Privacy deposit",
  withdrawal: "Privacy withdrawal",
  transfer: "Private transfer",
  join: "Private join",
  operation: "Privacy pool",
};

//C6 form byte → action: D0, D1, T1, T2, T3, W partial, W partial with change, W full, J2
/** @type {PoolAction[]} */
const C6_FORMS = ["deposit", "deposit", "transfer", "transfer", "transfer", "withdrawal", "withdrawal", "withdrawal", "join"];

/**
 * Little-endian script number, as the pool puts amounts in its witness.
 * @param {string} hex
 * @returns {bigint | null}
 */
function scriptNumber(hex) {
  if (!hex || hex.length % 2 !== 0 || hex.length > 18 || !/^[0-9a-f]*$/i.test(hex)) return null;
  let value = 0n;
  for (let i = hex.length - 2; i >= 0; i -= 2) value = value * 256n + BigInt(parseInt(hex.slice(i, i + 2), 16));
  return value;
}

/**
 * What a transaction did to a privacy pool, or null when it is not a pool transaction.
 * @param {TxInput[]} inputs
 * @param {TxOutput[]} outputs
 * @returns {{pool: string, action: PoolAction, asset: string, amount: bigint | null} | null}
 */
export function privacyPoolInfo(inputs, outputs) {
  const state = outputs[0];
  if (
    !state ||
    state.type !== "transfer_asset" ||
    state.value !== 0n ||
    !state.hex.startsWith("5120") ||
    !state.asset ||
    !/#POOL$/.test(state.asset.name) ||
    state.asset.amount !== 100000000n ||
    !/^[0-9a-f]{64}$/i.test(state.asset.message || "")
  ) {
    return null;
  }
  const pool = state.asset.name;
  const witness = inputs[0] && inputs[0].witness;
  const reserveIn = inputs[1] && inputs[1].witness && inputs[1].witness[0] === "00" ? inputs[1] : null;
  //The reserve goes back to its own address; with no reserve before, it is output 1
  let reserveOut = null;
  if (reserveIn && reserveIn.address) {
    reserveOut = outputs.find((output, index) => index > 0 && output.address === reserveIn.address) || null;
  } else if (outputs[1] && outputs[1].address && outputs[1].address !== state.address) {
    reserveOut = outputs[1];
  }
  //An asset pool keeps an asset in its reserve (0 XNA on the input), an XNA pool keeps XNA.
  //Without the spent output at hand, an asset pool is named after its asset: ASSET#POOL.
  const assetReserve = (reserveOut && reserveOut.asset) || (reserveIn && (reserveIn.asset || reserveIn.value === 0n));
  const asset =
    (reserveOut && reserveOut.asset && reserveOut.asset.name) ||
    (reserveIn && reserveIn.asset && reserveIn.asset.name) ||
    (assetReserve ? pool.replace(/#POOL$/, "") : "XNA");
  if (!witness || witness.length === 0) return { pool, action: "create", asset, amount: null };
  if (witness[0] !== "10") return { pool, action: "operation", asset, amount: null };

  const held = (output) => (output.asset ? output.asset.amount : output.value);
  //Emptied reserve: nothing goes back to its address
  const heldOut = reserveOut ? held(reserveOut) : reserveIn ? 0n : null;
  let heldIn = 0n;
  if (reserveIn) heldIn = reserveIn.asset ? reserveIn.asset.amount : assetReserve ? null : reserveIn.value;
  const delta = heldIn !== null && heldOut !== null ? heldOut - heldIn : null;

  /** @type {PoolAction} */
  let action = "operation";
  let amount = null;
  if ((witness.length === 13 || witness.length === 14) && /^0[23]/.test(witness[1] || "")) {
    action = C6_FORMS[parseInt(witness[1].slice(2, 4), 16)] || "operation";
    //A deposit states its amount in the witness, which also covers asset pools
    if (action === "deposit") amount = scriptNumber(witness[10] || "");
  } else if (witness.length === 7) {
    action = "withdrawal";
  } else if (witness.length === 8) {
    action = !reserveIn || (delta !== null && delta > 0n) ? "deposit" : "transfer";
  }
  if (amount === null && delta !== null && (action === "deposit" || action === "withdrawal")) {
    amount = delta < 0n ? -delta : delta;
  }
  return { pool, action, asset, amount };
}

const ASSET_TYPES = ["new_asset", "transfer_asset", "reissue_asset"];

/**
 * An asset message is an IPFS content id or a 64 character hash (a txid).
 * @param {string} message
 * @returns {boolean}
 */
export function isIpfsHash(message) {
  return /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[a-z2-7]{50,})$/.test(String(message || ""));
}

/**
 * @param {any} asset scriptPubKey.asset as the node sends it
 * @returns {AssetAmount | null}
 */
function readAsset(asset) {
  if (!asset || !asset.name) return null;
  /** @type {AssetAmount} */
  const result = { name: String(asset.name), amount: toSatoshis(asset.amount) };
  if (asset.message) result.message = String(asset.message);
  return result;
}

/**
 * Payload of an OP_RETURN script: drop OP_RETURN and the push opcode.
 * @param {string} hex scriptPubKey hex
 * @returns {string}
 */
export function nullDataPayload(hex) {
  const text = String(hex || "").toLowerCase();
  if (!text.startsWith("6a")) return text;
  const rest = text.slice(2);
  const op = parseInt(rest.slice(0, 2), 16);
  if (Number.isNaN(op)) return "";
  if (op >= 1 && op <= 0x4b) return rest.slice(2);
  if (op === 0x4c) return rest.slice(4);
  if (op === 0x4d) return rest.slice(6);
  if (op === 0x4e) return rest.slice(10);
  return rest;
}

/**
 * Printable text inside a hex payload, or null when it is binary.
 * @param {string} hex
 * @returns {string | null}
 */
export function payloadText(hex) {
  if (!hex || hex.length % 2 !== 0) return null;
  let text = "";
  for (let i = 0; i < hex.length; i += 2) {
    const code = parseInt(hex.slice(i, i + 2), 16);
    if (code < 0x20 || code > 0x7e) return null;
    text += String.fromCharCode(code);
  }
  return text;
}

/**
 * Inputs of a verbose transaction. `prevouts` fills in what the input itself
 * does not carry, e.g. the asset of an asset input ("txid:vout" → output).
 * @param {any[]} vin
 * @param {Record<string, {address?: string | null, value?: any, asset?: any}>} [prevouts]
 * @returns {TxInput[]}
 */
export function readInputs(vin, prevouts = {}) {
  return (vin || []).map((input) => {
    if (input.coinbase !== undefined) {
      return { coinbase: true, coinbaseHex: String(input.coinbase), address: null, value: null, asset: null, witness: null };
    }
    const prevout = prevouts[input.txid + ":" + input.vout];
    let value = null;
    if (input.valueSat !== undefined && input.valueSat !== null) value = rawSatoshis(input.valueSat);
    else if (input.value !== undefined && input.value !== null) value = toSatoshis(input.value);
    else if (prevout && prevout.value !== undefined) value = toSatoshis(prevout.value);
    return {
      coinbase: false,
      txid: input.txid,
      vout: input.vout,
      address: input.address || (prevout && prevout.address) || null,
      value,
      asset: readAsset(prevout && prevout.asset),
      witness: Array.isArray(input.txinwitness) ? input.txinwitness.map(String) : null,
    };
  });
}

/**
 * Outputs of a verbose transaction.
 * @param {any[]} vout
 * @param {TxInput[]} [inputs] to tell which outputs return to the sender
 * @returns {TxOutput[]}
 */
export function readOutputs(vout, inputs = []) {
  const funding = new Set(inputs.map((input) => input.address).filter(Boolean));
  const coinbase = inputs.some((input) => input.coinbase);
  return (vout || []).map((output, index) => {
    const spk = output.scriptPubKey || {};
    const type = String(spk.type || "nonstandard");
    const address = spk.address || (Array.isArray(spk.addresses) ? spk.addresses[0] : null) || null;
    return {
      n: typeof output.n === "number" ? output.n : index,
      type,
      address,
      value: toSatoshis(output.value),
      asset: readAsset(spk.asset),
      data: type === "nulldata" ? nullDataPayload(spk.hex) : null,
      hex: String(spk.hex || "").toLowerCase(),
      change: !coinbase && !!address && funding.has(address),
    };
  });
}

/**
 * Kind and tags of a transaction.
 * @param {TxInput[]} inputs
 * @param {TxOutput[]} outputs
 * @returns {{kind: TxKind, label: string, tags: string[], pool: ReturnType<typeof privacyPoolInfo>}}
 */
export function classifyTransaction(inputs, outputs) {
  /** @type {TxKind} */
  let kind = "payment";
  const assetOutputs = outputs.filter((output) => ASSET_TYPES.includes(output.type) && output.asset);
  const names = assetOutputs.map((output) => /** @type {AssetAmount} */ (output.asset).name);
  const mainName = names.find((name) => assetType(name) !== "owner") || names[0];

  const pool = privacyPoolInfo(inputs, outputs);
  if (inputs.some((input) => input.coinbase)) {
    kind = "coinbase";
  } else if (pool) {
    kind = "privacy";
  } else if (outputs.some((output) => output.type === "new_asset")) {
    kind = "asset-issue";
  } else if (outputs.some((output) => output.type === "reissue_asset")) {
    kind = "asset-reissue";
  } else if (mainName && assetType(mainName) === "qualifier") {
    kind = "qualifier";
  } else if (mainName && assetType(mainName) === "depin") {
    kind = "depin";
  } else if (assetOutputs.length > 0) {
    kind = "asset-transfer";
  } else if (outputs.length > 0 && outputs.every((output) => output.type === "nulldata")) {
    kind = "data";
  }

  const label = pool ? POOL_ACTION_LABELS[pool.action] : TX_KIND_LABELS[kind];
  const tags = [label];
  //The pool's state digest travels as an asset message: it is not a memo
  const messages = pool ? [] : assetOutputs.map((output) => output.asset && output.asset.message).filter(Boolean);
  if (messages.some((message) => isIpfsHash(message))) tags.push("IPFS memo");
  else if (messages.length > 0) tags.push("Memo");
  if (kind !== "coinbase" && kind !== "data" && outputs.some((output) => output.type === "nulldata")) {
    tags.push("OP_RETURN data");
  }
  if (outputs.some((output) => output.address && isBurnAddress(output.address))) tags.push("Burn");
  //AuthScript also locks pools and other contracts: only strict PQ outputs say post-quantum
  if (outputs.some((output) => output.type === "witness_v2_strict_pq")) {
    tags.push("Post-quantum");
  }
  return { kind, label, tags, pool };
}

/**
 * The amount a person would say "moved" in this transaction: what left for
 * other addresses, in the asset the transaction is about.
 * @param {TxKind} kind
 * @param {TxOutput[]} outputs
 * @returns {{asset: string, amount: bigint} | null}
 */
export function movedAmount(kind, outputs) {
  const assetOutputs = outputs.filter((output) => output.asset);
  if (kind !== "coinbase" && kind !== "payment" && kind !== "data" && assetOutputs.length > 0) {
    const names = assetOutputs.map((output) => /** @type {AssetAmount} */ (output.asset).name);
    const name = names.find((n) => assetType(n) !== "owner") || names[0];
    const ofAsset = assetOutputs.filter((output) => output.asset && output.asset.name === name);
    const away = ofAsset.filter((output) => !output.change);
    const counted = kind === "asset-issue" || away.length === 0 ? ofAsset : away;
    const amount = counted.reduce((sum, output) => sum + (output.asset ? output.asset.amount : 0n), 0n);
    return { asset: name, amount };
  }
  const xna = outputs.filter((output) => !output.asset && output.type !== "nulldata");
  if (xna.length === 0) return null;
  const away = kind === "coinbase" ? xna : xna.filter((output) => !output.change);
  const counted = away.length > 0 ? away : xna;
  return { asset: "XNA", amount: counted.reduce((sum, output) => sum + output.value, 0n) };
}

/**
 * Everything a list row or a header needs about a transaction.
 * @param {{vin: any[], vout: any[], size?: number, vsize?: number}} tx verbose transaction
 * @param {Record<string, any>} [prevouts]
 */
export function summarizeTransaction(tx, prevouts = {}) {
  const inputs = readInputs(tx.vin, prevouts);
  const outputs = readOutputs(tx.vout, inputs);
  const { kind, label, tags, pool } = classifyTransaction(inputs, outputs);
  const totalOut = outputs.reduce((sum, output) => sum + output.value, 0n);
  const coinbase = kind === "coinbase";
  const known = !coinbase && inputs.length > 0 && inputs.every((input) => input.value !== null);
  const totalIn = known ? inputs.reduce((sum, input) => sum + /** @type {bigint} */ (input.value), 0n) : null;
  const fee = totalIn !== null && totalIn >= totalOut ? totalIn - totalOut : null;
  const vsize = tx.vsize || tx.size || 0;
  const feeRate = fee !== null && vsize > 0 ? Number(fee) / vsize : null;
  return {
    kind,
    label,
    tags,
    inputs,
    outputs,
    inputCount: inputs.length,
    outputCount: outputs.length,
    totalIn,
    totalOut,
    fee,
    feeRate,
    //What enters or leaves a pool is the movement; inside the pool amounts stay private
    moved: pool ? (pool.amount !== null ? { asset: pool.asset, amount: pool.amount } : null) : movedAmount(kind, outputs),
    pool,
  };
}
