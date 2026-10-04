import { describe, expect, it } from "vitest";
import {
  formatBytes,
  formatDifficulty,
  formatDuration,
  formatHashrate,
  formatShare,
  formatUsd,
  middleEllipsis,
  timeAgo,
} from "./format";
import { formatShortAmount, splitAmount, usdValue } from "./amount";
import { resolveRoute } from "./route";

describe("format", () => {
  it("keeps both ends of a hash", () => {
    expect(middleEllipsis("0123456789abcdef", 4, 3)).toBe("0123…def");
    expect(middleEllipsis("short", 4, 3)).toBe("short");
  });

  it("says how long ago", () => {
    const now = 1_000_000 * 1000;
    expect(timeAgo(1_000_000 - 12, now)).toBe("12 s ago");
    expect(timeAgo(1_000_000 - 180, now)).toBe("3 min ago");
    expect(timeAgo(1_000_000 - 5 * 3600, now)).toBe("5 h ago");
    expect(timeAgo(1_000_000 - 3 * 86400, now)).toBe("3 d ago");
    expect(timeAgo(null, now)).toBe("—");
  });

  it("formats sizes, rates and prices", () => {
    expect(formatBytes(254)).toBe("254 B");
    expect(formatBytes(2048)).toBe("2.0 kB");
    expect(formatHashrate(1078.325)).toEqual({ value: "1.08", unit: "kH/s" });
    expect(formatDuration(40.8)).toEqual({ value: "40.8", unit: "s" });
    expect(formatDifficulty(0.000008500308)).toBe("8.50 × 10⁻⁶");
    expect(formatDifficulty(18402.6123)).toBe("18,402.61");
    expect(formatUsd(0.00214)).toBe("$0.00214");
    expect(formatShare(0.25)).toBe("25%");
    expect(formatShare(1e-11)).toBe("<0.01%");
  });
});

describe("amounts", () => {
  it("splits whole and decimals", () => {
    expect(splitAmount("200000.01468825")).toEqual({ whole: "200,000", fraction: "01468825" });
    expect(splitAmount("25000")).toEqual({ whole: "25,000", fraction: "" });
  });

  it("shortens without rounding up", () => {
    expect(formatShortAmount("12450.509")).toBe("12,450.5");
    expect(formatShortAmount("0.00226")).toBe("<0.01");
    expect(formatShortAmount("-3.999")).toBe("-3.99");
  });

  it("converts to dollars", () => {
    expect(usdValue("1000", 0.5)).toBe("$500.00");
    expect(usdValue("0.00226", 0.00214)).toBe("less than $0.01");
    expect(usdValue("1", null)).toBe(null);
  });
});

describe("routes", () => {
  it("resolves every page", () => {
    expect(resolveRoute("/")).toEqual({ name: "home" });
    expect(resolveRoute("/block/306")).toEqual({ name: "block", id: "306" });
    expect(resolveRoute("/blockhash/0000abc")).toEqual({ name: "block", id: "0000abc" });
    expect(resolveRoute("/asset/T43ESEP26%23state")).toEqual({ name: "asset", id: "T43ESEP26#state" });
    expect(resolveRoute("/asset/RWAX/SUB")).toEqual({ name: "asset", id: "RWAX/SUB" });
    expect(resolveRoute("/nope")).toEqual({ name: "notfound" });
  });
});
