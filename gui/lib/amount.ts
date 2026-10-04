/*
  The GUI side of shared/amount.js. Amounts from the API are decimal strings
  ("1234.5"); format them through here, never through Number, or the last
  digits of large amounts are lost.
*/
export type Amount = number | string;

export {
  COIN,
  formatAmount,
  formatRawSatoshis,
  formatSatoshis,
  rawSatoshis,
  satoshisToDecimal,
  sumSatoshis,
  toSatoshis,
} from "../../shared/amount.js";

import { formatAmount, formatSatoshis, toSatoshis } from "../../shared/amount.js";

/** Whole part and decimals apart, so the decimals can be set smaller */
export function splitAmount(value: Amount | null | undefined): { whole: string; fraction: string } {
  const text = formatAmount(value);
  const at = text.indexOf(".");
  if (at === -1) return { whole: text, fraction: "" };
  return { whole: text.slice(0, at), fraction: text.slice(at + 1) };
}

/** -1, 0 or 1 */
export function amountSign(value: Amount | null | undefined): number {
  const satoshis = toSatoshis(value);
  return satoshis > 0n ? 1 : satoshis < 0n ? -1 : 0;
}

/** Amount without its sign */
export function absAmount(value: Amount | null | undefined): string {
  const text = String(value ?? "0");
  return text.startsWith("-") ? text.slice(1) : text;
}

/**
 * At most two decimals, for summaries: 12,450.5 or 0.00226 → "<0.01".
 * Digits are dropped, never rounded up.
 */
export function formatShortAmount(value: Amount | null | undefined): string {
  const satoshis = toSatoshis(value);
  const negative = satoshis < 0n;
  const magnitude = negative ? -satoshis : satoshis;
  const hundredth = 1000000n;
  const kept = magnitude - (magnitude % hundredth);
  if (kept === 0n && magnitude !== 0n) return (negative ? "-" : "") + "<0.01";
  return (negative ? "-" : "") + formatSatoshis(kept);
}

/** Value in US dollars of an XNA amount, for display only */
export function usdValue(value: Amount | null | undefined, price: number | null | undefined): string | null {
  if (!price) return null;
  const coins = Number(toSatoshis(value)) / 1e8;
  const usd = coins * price;
  if (usd !== 0 && Math.abs(usd) < 0.01) return "less than $0.01";
  return usd.toLocaleString("en-US", { style: "currency", currency: "USD" });
}
