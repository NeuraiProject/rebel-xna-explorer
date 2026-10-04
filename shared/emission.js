/*
  How many coins Neurai creates per block, and how many exist so far.

  Ported from GetBlockSubsidy in the node (src/validation.cpp, NIP-028) and the
  consensus parameters in src/chainparams.cpp. The node exposes no RPC with the
  total supply that a public proxy allows (gettxoutsetinfo is blocked), so the
  explorer adds up the schedule itself and checks it against the tip's coinbase.

  The reward starts at 50,000 XNA and drops 5% every "micro-halving"
  (14,400 blocks), then stays on floors: 5,000 XNA from 36 micro-halvings,
  4,000 from 72, 3,000 from 108, 2,000 from 144, 1,000 from 180, 500 from 216,
  and nothing from 383. From NIP-028's activation height (testnet: block 10)
  micro-halvings come every 28,800 blocks and the reward is halved, so ~30 s
  blocks pay out at the same rate as the old 60 s ones.
*/

/** @typedef {{interval: number, reductionHeight: number, intervalPost: number}} EmissionParams */

/** @type {Record<string, EmissionParams>} */
export const EMISSION = {
  main: { interval: 14400, reductionHeight: Infinity, intervalPost: 14400 },
  test: { interval: 14400, reductionHeight: 10, intervalPost: 28800 },
  regtest: { interval: 14400, reductionHeight: Infinity, intervalPost: 28800 },
};

const COIN = 100000000;

//[micro-halvings, floor in XNA], highest first
const FLOORS = [
  [216, 500],
  [180, 1000],
  [144, 2000],
  [108, 3000],
  [72, 4000],
  [36, 5000],
];

/**
 * @param {number} height
 * @param {EmissionParams} params
 */
function halvingsAt(height, params) {
  const post = height >= params.reductionHeight;
  const halvings = post
    ? Math.floor(params.reductionHeight / params.interval) + Math.floor((height - params.reductionHeight) / params.intervalPost)
    : Math.floor(height / params.interval);
  return { post, halvings };
}

/**
 * New coins in the block at a height, in satoshis (fees not included).
 * @param {number} height
 * @param {EmissionParams} params
 * @returns {bigint}
 */
export function blockSubsidy(height, params) {
  const { post, halvings } = halvingsAt(height, params);
  const half = (/** @type {bigint} */ value) => (post ? value >> 1n : value);
  if (halvings >= 383) return 0n;
  for (const [from, xna] of FLOORS) {
    if (halvings >= from) return half(BigInt(xna) * BigInt(COIN));
  }
  //The node multiplies an integer by a double and truncates: do the same
  return half(BigInt(Math.trunc(50000 * COIN * Math.pow(0.95, halvings))));
}

/**
 * Last height that pays the same subsidy as `height`.
 * @param {number} height
 * @param {EmissionParams} params
 */
function segmentEnd(height, params) {
  if (height < params.reductionHeight) {
    const next = (Math.floor(height / params.interval) + 1) * params.interval;
    return Math.min(next, params.reductionHeight) - 1;
  }
  const done = Math.floor((height - params.reductionHeight) / params.intervalPost) + 1;
  return params.reductionHeight + done * params.intervalPost - 1;
}

/**
 * Coins created by the blocks 0 to `tipHeight`, genesis included, in satoshis.
 * Added up per run of equal subsidies, so it costs a few hundred steps at most.
 * @param {number} tipHeight
 * @param {EmissionParams} params
 * @returns {bigint}
 */
export function totalMined(tipHeight, params) {
  let total = 0n;
  for (let height = 0; height <= tipHeight; ) {
    const subsidy = blockSubsidy(height, params);
    const end = Math.min(segmentEnd(height, params), tipHeight);
    total += BigInt(end - height + 1) * subsidy;
    height = end + 1;
  }
  return total;
}

/**
 * Every coin the schedule will ever create, in satoshis.
 * @param {EmissionParams} params
 * @returns {bigint}
 */
export function maxSupply(params) {
  let total = 0n;
  for (let height = 0; ; ) {
    const subsidy = blockSubsidy(height, params);
    if (subsidy === 0n) return total;
    const end = segmentEnd(height, params);
    total += BigInt(end - height + 1) * subsidy;
    height = end + 1;
  }
}
