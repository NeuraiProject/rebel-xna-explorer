/*
  neurai-rpc >= 0.6 keeps amounts exact: values that fit in a JavaScript number
  arrive as numbers, values that would lose digits arrive as decimal strings.
  Never add them with "+" (strings would be concatenated), convert to satoshis.

  Shared by the server and the GUI, so it is plain JavaScript.
*/

/** @typedef {number | string} Amount */

export const COIN = 100000000n;
const DECIMAL = /^-?[0-9]+(\.[0-9]+)?$/;
const INTEGER = /^-?[0-9]+$/;

/**
 * Decimal coins (as the node sends them) to satoshis.
 * @param {Amount | null | undefined} value
 * @returns {bigint}
 */
export function toSatoshis(value) {
  if (value === null || value === undefined || value === "") {
    return 0n;
  }
  let text = typeof value === "number" ? value.toFixed(8) : String(value).trim();
  if (!DECIMAL.test(text)) {
    //Unexpected notation, e.g. exponent, fall back to Number
    text = Number(text).toFixed(8);
    if (!DECIMAL.test(text)) {
      return 0n;
    }
  }
  const negative = text.startsWith("-");
  const [whole, fraction = ""] = text.replace("-", "").split(".");
  const satoshis =
    BigInt(whole) * COIN + BigInt(fraction.slice(0, 8).padEnd(8, "0"));
  return negative ? -satoshis : satoshis;
}

/**
 * Integer satoshis as the node sends them (number, or decimal string when unsafe).
 * @param {Amount | bigint | null | undefined} value
 * @returns {bigint}
 */
export function rawSatoshis(value) {
  if (value === null || value === undefined || value === "") {
    return 0n;
  }
  if (typeof value === "bigint") {
    return value;
  }
  const text = String(value).trim();
  if (INTEGER.test(text)) {
    return BigInt(text);
  }
  //Not an integer, e.g. "1e+21": go through Number, precision is lost anyway
  const number = Number(text);
  return Number.isFinite(number) ? BigInt(Math.round(number)) : 0n;
}

/**
 * Satoshis to a plain decimal string without grouping, e.g. "1234.5".
 * This is the form the API sends, it parses back exactly with toSatoshis.
 * @param {bigint} satoshis
 * @returns {string}
 */
export function satoshisToDecimal(satoshis) {
  const negative = satoshis < 0n;
  const absolute = negative ? -satoshis : satoshis;
  const whole = (absolute / COIN).toString();
  const fraction = (absolute % COIN).toString().padStart(8, "0").replace(/0+$/, "");
  return (negative ? "-" : "") + whole + (fraction ? "." + fraction : "");
}

/**
 * Satoshis for people: thousands grouped, trailing zeros dropped, e.g. "1,234.5".
 * Always English separators, so a grouped number never looks like a decimal one.
 * @param {bigint} satoshis
 * @returns {string}
 */
export function formatSatoshis(satoshis) {
  const negative = satoshis < 0n;
  const absolute = negative ? -satoshis : satoshis;
  const whole = (absolute / COIN).toLocaleString("en-US");
  const fraction = (absolute % COIN).toString().padStart(8, "0").replace(/0+$/, "");
  return (negative ? "-" : "") + whole + (fraction ? "." + fraction : "");
}

/**
 * @param {Amount | null | undefined} value decimal coins
 * @returns {string}
 */
export function formatAmount(value) {
  return formatSatoshis(toSatoshis(value));
}

/**
 * @param {Amount | null | undefined} value integer satoshis
 * @returns {string}
 */
export function formatRawSatoshis(value) {
  return formatSatoshis(rawSatoshis(value));
}

/**
 * Sum of decimal amounts, exact.
 * @param {Array<Amount | null | undefined>} values
 * @returns {bigint} satoshis
 */
export function sumSatoshis(values) {
  return values.reduce((sum, value) => sum + toSatoshis(value), 0n);
}
