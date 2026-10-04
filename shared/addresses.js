/*
  Address families of Neurai. The prefix tells them apart; testnet adds a "t".

    Legacy            P2PKH                                N…    / t…
    ECDSA witness     strict ECDSA witness v3              nq1r… / tnq1r…
    Post-quantum      strict PQ witness v2                 pq1z… / tpq1z…
    AuthScript        generic AuthScript v1 (ML-DSA-44)    nc1p… / tnc1p…

  The node used to write AuthScript as nq1p… / tnq1p…; that form is rejected now.
*/

/**
 * @typedef {"legacy" | "ecdsa-witness" | "post-quantum" | "authscript" | "old-authscript" | "unknown"} AddressFamily
 */

/** @type {Record<AddressFamily, string>} */
export const ADDRESS_FAMILY_LABELS = {
  legacy: "Legacy",
  "ecdsa-witness": "ECDSA witness",
  "post-quantum": "Post-quantum",
  authscript: "AuthScript",
  "old-authscript": "Old AuthScript format",
  unknown: "Address",
};

/**
 * @param {string} address
 * @returns {AddressFamily}
 */
export function addressFamily(address) {
  const text = String(address || "").trim();
  const lower = text.toLowerCase();
  if (/^t?nq1r/.test(lower)) return "ecdsa-witness";
  if (/^t?nq1p/.test(lower)) return "old-authscript";
  if (/^t?pq1z/.test(lower)) return "post-quantum";
  if (/^t?nc1p/.test(lower)) return "authscript";
  if (/^[Nt][1-9A-HJ-NP-Za-km-z]{25,40}$/.test(text)) return "legacy";
  return "unknown";
}

/**
 * Burn addresses are valid addresses whose keys nobody has. They are made by
 * hand, so they read like words padded with X: tBURNXXXXXXXXXXXXXXXXXXXXXXXVZLroy.
 * @param {string} address
 * @returns {boolean}
 */
export function isBurnAddress(address) {
  return /^[Nt][1-9A-HJ-NP-Za-km-z]*X{10,}/.test(String(address || ""));
}
