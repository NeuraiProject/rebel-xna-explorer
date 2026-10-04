import { describe, expect, it } from "vitest";
import {
  formatAmount,
  formatRawSatoshis,
  formatSatoshis,
  rawSatoshis,
  satoshisToDecimal,
  sumSatoshis,
  toSatoshis,
} from "./amount.js";

describe("toSatoshis", () => {
  it("reads numbers and decimal strings exactly", () => {
    expect(toSatoshis(1)).toBe(100000000n);
    expect(toSatoshis(0.00000001)).toBe(1n);
    expect(toSatoshis("120.47588")).toBe(12047588000n);
    expect(toSatoshis("-0.5")).toBe(-50000000n);
  });

  it("keeps digits a JavaScript number would lose", () => {
    expect(toSatoshis("92233720368.54775807")).toBe(9223372036854775807n);
  });

  it("treats missing values as zero", () => {
    expect(toSatoshis(null)).toBe(0n);
    expect(toSatoshis(undefined)).toBe(0n);
    expect(toSatoshis("")).toBe(0n);
  });

  it("falls back to Number for exponent notation", () => {
    expect(toSatoshis("1e-8")).toBe(1n);
  });
});

describe("rawSatoshis", () => {
  it("reads integer satoshis as numbers, strings or bigints", () => {
    expect(rawSatoshis(2500000000000)).toBe(2500000000000n);
    expect(rawSatoshis("54446600606628931")).toBe(54446600606628931n);
    expect(rawSatoshis(5n)).toBe(5n);
    expect(rawSatoshis(null)).toBe(0n);
  });
});

describe("formatting", () => {
  it("writes plain decimals for the API", () => {
    expect(satoshisToDecimal(12047588000n)).toBe("120.47588");
    expect(satoshisToDecimal(2500000000000n)).toBe("25000");
    expect(satoshisToDecimal(-1n)).toBe("-0.00000001");
  });

  it("groups thousands with English separators whatever the locale", () => {
    expect(formatSatoshis(100000000000000n)).toBe("1,000,000");
    expect(formatAmount("1234567.891")).toBe("1,234,567.891");
    expect(formatRawSatoshis("2500000000000")).toBe("25,000");
  });

  it("sums exactly", () => {
    expect(sumSatoshis(["0.1", 0.2, "0.3"])).toBe(60000000n);
  });
});
