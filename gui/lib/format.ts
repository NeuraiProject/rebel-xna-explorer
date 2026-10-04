/*
  Formatting for people. English separators everywhere, matching the copy.
*/

export function formatNumber(value: number | null | undefined, maxDigits = 0): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return value.toLocaleString("en-US", { maximumFractionDigits: maxDigits });
}

export function formatBytes(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || !Number.isFinite(bytes)) return "—";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " kB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

/** Keeps the start and the end, the parts people compare: NihAfZ…LSV5qN */
export function middleEllipsis(text: string, head = 8, tail = 6): string {
  if (!text || text.length <= head + tail + 1) return text;
  return text.slice(0, head) + "…" + text.slice(-tail);
}

export function plural(count: number, one: string, many = one + "s"): string {
  return formatNumber(count) + " " + (count === 1 ? one : many);
}

/** "12 s ago", "3 min ago", "5 h ago", "2 d ago" */
export function timeAgo(unixSeconds: number | null | undefined, nowMs: number): string {
  if (!unixSeconds) return "—";
  const seconds = Math.max(0, Math.round(nowMs / 1000 - unixSeconds));
  if (seconds < 60) return seconds + " s ago";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes + " min ago";
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return hours + " h ago";
  const days = Math.floor(hours / 24);
  if (days < 365) return days + " d ago";
  const years = Math.floor(days / 365);
  return years + (years === 1 ? " year ago" : " years ago");
}

function pad(n: number): string {
  return n < 10 ? "0" + n : String(n);
}

/** Local date and time, unambiguous in every locale: 2026-10-04 16:05:12 */
export function formatDateTime(unixSeconds: number | null | undefined): string {
  if (!unixSeconds) return "—";
  const d = new Date(unixSeconds * 1000);
  return (
    d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + " " +
    pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds())
  );
}

export function formatDuration(seconds: number | null | undefined): { value: string; unit: string } {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds)) return { value: "—", unit: "" };
  if (seconds < 120) return { value: seconds.toFixed(1), unit: "s" };
  return { value: (seconds / 60).toFixed(1), unit: "min" };
}

export function formatHashrate(hashesPerSecond: number | null | undefined): { value: string; unit: string } {
  if (hashesPerSecond === null || hashesPerSecond === undefined || !Number.isFinite(hashesPerSecond)) {
    return { value: "—", unit: "" };
  }
  const units = ["H/s", "kH/s", "MH/s", "GH/s", "TH/s", "PH/s", "EH/s"];
  let value = hashesPerSecond;
  let index = 0;
  while (value >= 1000 && index < units.length - 1) {
    value /= 1000;
    index++;
  }
  return { value: value.toFixed(value >= 100 ? 0 : value >= 10 ? 1 : 2), unit: units[index] };
}

/** Very small difficulties (testnet) read better as 8.09 × 10⁻⁶ */
export function formatDifficulty(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  if (value !== 0 && Math.abs(value) < 0.001) {
    const [mantissa, exponent] = value.toExponential(2).split("e");
    const superscript: Record<string, string> = {
      "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
    };
    const power = String(parseInt(exponent, 10)).split("").map((c) => superscript[c] || c).join("");
    return mantissa + " × 10" + power;
  }
  return value.toLocaleString("en-US", { maximumFractionDigits: value < 10 ? 4 : 2 });
}

export function formatUsd(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  //Small prices need their significant digits, not two decimals
  const digits = value >= 1 ? 2 : Math.min(8, Math.max(2, 1 - Math.floor(Math.log10(value)) + 2));
  return value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: digits });
}

/** Share of a total: 0.25 → "25%", 0.00001 → "<0.01%" */
export function formatShare(share: number | null | undefined): string {
  if (share === null || share === undefined || !Number.isFinite(share)) return "—";
  const percent = share * 100;
  if (percent > 0 && percent < 0.01) return "<0.01%";
  return percent.toLocaleString("en-US", { maximumFractionDigits: percent < 10 ? 2 : 1 }) + "%";
}

export function formatFeeRate(satPerVbyte: number | null | undefined): string {
  if (satPerVbyte === null || satPerVbyte === undefined || !Number.isFinite(satPerVbyte)) return "—";
  return satPerVbyte.toLocaleString("en-US", { maximumFractionDigits: satPerVbyte < 10 ? 2 : 0 }) + " sat/vB";
}

/** Big amounts for a tile: 17.56 B, 563.05 M, 12.3 k */
export function formatCompact(value: number | null | undefined): { value: string; unit: string } {
  if (value === null || value === undefined || !Number.isFinite(value)) return { value: "—", unit: "" };
  const steps: [number, string][] = [
    [1e12, "T"],
    [1e9, "B"],
    [1e6, "M"],
    [1e3, "k"],
  ];
  for (const [size, unit] of steps) {
    if (Math.abs(value) >= size) return { value: (value / size).toFixed(2), unit };
  }
  return { value: value.toLocaleString("en-US", { maximumFractionDigits: 2 }), unit: "" };
}
