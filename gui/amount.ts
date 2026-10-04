/*
  neurai-rpc >= 0.6 keeps amounts exact: values that fit in a JavaScript number
  arrive as numbers, values that would lose digits arrive as decimal strings.
  Never add them with "+" (strings would be concatenated), convert to satoshis.
*/
export type Amount = number | string;

const COIN = 100000000n;
const DECIMAL = /^-?[0-9]+(\.[0-9]+)?$/;

export function toSatoshis(value: Amount | null | undefined): bigint {
  if (value === null || value === undefined || value === "") {
    return 0n;
  }
  let text = typeof value === "number" ? value.toFixed(8) : value.trim();
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

export function formatSatoshis(satoshis: bigint): string {
  const negative = satoshis < 0n;
  const absolute = negative ? -satoshis : satoshis;
  const whole = (absolute / COIN).toLocaleString();
  const fraction = (absolute % COIN)
    .toString()
    .padStart(8, "0")
    .replace(/0+$/, "");
  return (negative ? "-" : "") + whole + (fraction ? "." + fraction : "");
}

export function formatAmount(value: Amount | null | undefined): string {
  return formatSatoshis(toSatoshis(value));
}

//Integer satoshis as the node sends them (number, or decimal string when unsafe)
export function rawSatoshis(value: Amount | null | undefined): bigint {
  if (value === null || value === undefined || value === "") {
    return 0n;
  }
  return BigInt(value);
}

export function formatRawSatoshis(value: Amount | null | undefined): string {
  return formatSatoshis(rawSatoshis(value));
}
