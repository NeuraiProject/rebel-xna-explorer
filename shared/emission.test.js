import { describe, expect, it } from "vitest";
import { EMISSION, blockSubsidy, maxSupply, totalMined } from "./emission.js";

const xna = (n) => BigInt(Math.round(n * 1e8));

//Every value here was read from a real coinbase (a block with no other transactions)
describe("blockSubsidy", () => {
  it("follows mainnet's 5% micro-halvings and floors", () => {
    const main = EMISSION.main;
    expect(blockSubsidy(0, main)).toBe(xna(50000));
    expect(blockSubsidy(14399, main)).toBe(xna(50000));
    expect(blockSubsidy(50000, main)).toBe(4286874999999n);
    expect(blockSubsidy(100000, main)).toBe(3675459453124n);
    expect(blockSubsidy(600000, main)).toBe(xna(5000));
    expect(blockSubsidy(1200000, main)).toBe(xna(4000));
    expect(blockSubsidy(1800000, main)).toBe(xna(3000));
    expect(blockSubsidy(383 * 14400, main)).toBe(0n);
  });

  it("halves testnet's reward from NIP-028's activation at block 10", () => {
    const test = EMISSION.test;
    expect(blockSubsidy(9, test)).toBe(xna(50000));
    expect(blockSubsidy(10, test)).toBe(xna(25000));
    expect(blockSubsidy(10 + 28800, test)).toBe(xna(23750));
  });
});

describe("totalMined", () => {
  it("adds up runs of equal rewards", () => {
    expect(totalMined(0, EMISSION.main)).toBe(xna(50000));
    expect(totalMined(14400, EMISSION.main)).toBe(xna(50000) * 14400n + xna(47500));
    //Testnet at 22,511: ten blocks of 50,000 and the rest at 25,000
    expect(totalMined(22511, EMISSION.test)).toBe(xna(563050000));
  });

  it("knows the most there will ever be", () => {
    expect(maxSupply(EMISSION.main)).toBe(totalMined(383 * 14400 - 1, EMISSION.main));
  });
});
