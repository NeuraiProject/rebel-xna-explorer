import { describe, expect, it } from "vitest";
import { nullDataPayload, payloadText, summarizeTransaction } from "./transactions.js";

const A = "tNYzjPgmYKmh1bVMJiJS6AL19b5mhpiNCX";
const B = "tPnf8YPhyyGg6c2in4gyMaCEQK62rVmsjF";
const BURN = "tBURNXXXXXXXXXXXXXXXXXXXXXXXVZLroy";

const pay = (address, value, n) => ({ value, n, scriptPubKey: { type: "pubkeyhash", addresses: [address] } });
const asset = (type, address, name, amount, n, extra = {}) => ({
  value: 0,
  n,
  scriptPubKey: { type, addresses: [address], asset: { name, amount, ...extra } },
});

describe("summarizeTransaction", () => {
  it("reads a coinbase", () => {
    const tx = {
      vin: [{ coinbase: "0232010101", sequence: 4294967295 }],
      vout: [pay(A, 25000.0033825, 0), { value: 0, n: 1, scriptPubKey: { type: "nulldata", hex: "6a24aa21a9ed" + "00".repeat(32) } }],
      size: 173,
      vsize: 146,
    };
    const summary = summarizeTransaction(tx);
    expect(summary.kind).toBe("coinbase");
    expect(summary.tags).toEqual(["Coinbase"]);
    expect(summary.fee).toBe(null);
    expect(summary.moved).toEqual({ asset: "XNA", amount: 2500000338250n });
    expect(summary.outputs[1].data).toBe("aa21a9ed" + "00".repeat(32));
  });

  it("reads a payment, its change and its fee", () => {
    const tx = {
      vin: [{ txid: "aa", vout: 0, valueSat: 25000000000, address: A }],
      vout: [pay(B, 180, 0), pay(A, 69.99774, 1)],
      size: 226,
      vsize: 226,
    };
    const summary = summarizeTransaction(tx);
    expect(summary.kind).toBe("payment");
    expect(summary.outputs[0].change).toBe(false);
    expect(summary.outputs[1].change).toBe(true);
    expect(summary.fee).toBe(226000n);
    expect(summary.feeRate).toBe(1000);
    expect(summary.moved).toEqual({ asset: "XNA", amount: 18000000000n });
  });

  it("counts a payment to oneself as moved", () => {
    const tx = { vin: [{ txid: "aa", vout: 0, value: 10, address: A }], vout: [pay(A, 9.999, 0)], vsize: 100 };
    expect(summarizeTransaction(tx).moved).toEqual({ asset: "XNA", amount: 999900000n });
  });

  it("reads an asset issue with its burn", () => {
    const tx = {
      vin: [{ txid: "aa", vout: 0, value: 20969.9516405, address: A }],
      vout: [
        pay(A, 19969.948258, 0),
        pay(BURN, 1000, 1),
        asset("new_asset", A, "RWAX!", 1, 2),
        asset("new_asset", A, "RWAX", 1000, 3, { units: 8 }),
      ],
      vsize: 330,
    };
    const summary = summarizeTransaction(tx);
    expect(summary.kind).toBe("asset-issue");
    expect(summary.tags).toContain("Burn");
    expect(summary.moved).toEqual({ asset: "RWAX", amount: 100000000000n });
    expect(summary.fee).toBe(338250n);
  });

  it("reads an asset transfer, using the prevouts for asset inputs", () => {
    const tx = {
      vin: [
        { txid: "p1", vout: 1, value: 120.48, address: A },
        { txid: "p2", vout: 2, value: 0, address: A },
      ],
      vout: [
        pay(A, 120.47588, 0),
        asset("transfer_asset", B, "ORBIT", 500, 1, { message: "QmXk3vTq9WbN2R7sYdH4fLpC8aZeJm5uVy1oKgB6tSrE2w" }),
        asset("transfer_asset", A, "ORBIT", 1500, 2),
      ],
      vsize: 412,
    };
    const summary = summarizeTransaction(tx, { "p2:2": { asset: { name: "ORBIT", amount: 2000 } } });
    expect(summary.kind).toBe("asset-transfer");
    expect(summary.tags).toEqual(["Asset transfer", "IPFS memo"]);
    expect(summary.inputs[1].asset).toEqual({ name: "ORBIT", amount: 200000000000n });
    expect(summary.moved).toEqual({ asset: "ORBIT", amount: 50000000000n });
    expect(summary.fee).toBe(412000n);
  });

  it("tells an IPFS memo from a hash memo", () => {
    const base = { vin: [{ txid: "aa", vout: 0, value: 1, address: A }], vsize: 200 };
    const hash = "0ba9f13db79294d8dc09aa27d3ca287b15c6b844797b942af689f40ee2a52acd";
    const tx = { ...base, vout: [asset("transfer_asset", B, "ORBIT", 1, 0, { message: hash })] };
    expect(summarizeTransaction(tx).tags).toEqual(["Asset transfer", "Memo"]);
  });

  it("names DePIN and qualifier transfers", () => {
    const base = { vin: [{ txid: "aa", vout: 0, value: 1, address: A }], vsize: 200 };
    expect(summarizeTransaction({ ...base, vout: [asset("transfer_asset", B, "&SENSOR", 1, 0)] }).kind).toBe("depin");
    expect(summarizeTransaction({ ...base, vout: [asset("transfer_asset", B, "#KYC", 1, 0)] }).kind).toBe("qualifier");
  });

  it("leaves the fee unknown when an input value is missing", () => {
    const tx = { vin: [{ txid: "aa", vout: 0 }], vout: [pay(B, 1, 0)], vsize: 100 };
    expect(summarizeTransaction(tx).fee).toBe(null);
  });

  it("tags post-quantum outputs", () => {
    const tx = {
      vin: [{ txid: "aa", vout: 0, value: 10, address: A }],
      vout: [{ value: 9, n: 0, scriptPubKey: { type: "witness_v2_strict_pq", addresses: ["tpq1zxyz"] } }],
      vsize: 100,
    };
    expect(summarizeTransaction(tx).tags).toContain("Post-quantum");
  });
});

describe("OP_RETURN payloads", () => {
  it("strips the opcode and the push length", () => {
    expect(nullDataPayload("6a0568656c6c6f")).toBe("68656c6c6f");
    expect(nullDataPayload("6a4c0568656c6c6f")).toBe("68656c6c6f");
  });

  it("reads printable text", () => {
    expect(payloadText("68656c6c6f")).toBe("hello");
    expect(payloadText("00ff")).toBe(null);
  });
});

describe("privacy pools", () => {
  const S = "tnc1pstate";
  const R = "tnc1preserve";
  const digest = "ab".repeat(32);
  const state = (pool = "POOLX#POOL", hex = "5120" + "00".repeat(32) + "c0") => ({
    value: 0,
    n: 0,
    scriptPubKey: { type: "transfer_asset", hex, addresses: [S], asset: { name: pool, amount: 1, message: digest } },
  });
  const reserve = (value, n = 1) => ({ value, n, scriptPubKey: { type: "witness_v1_authscript", hex: "5120" + "11".repeat(32), addresses: [R] } });
  const c6Witness = (form, amountHex = "00") => {
    const w = new Array(14).fill("aa");
    w[0] = "10";
    w[1] = "02" + form + "17";
    w[10] = amountHex;
    return w;
  };
  const stateIn = (witness) => ({ txid: "prev", vout: 0, value: 0, address: S, txinwitness: witness });
  const reserveIn = (value) => ({ txid: "res", vout: 1, value, address: R, txinwitness: ["00", "0052c420beef"] });

  it("recognizes the creation of a pool", () => {
    const tx = { vin: [{ txid: "a", vout: 0, value: 2, address: A }], vout: [state(), pay(A, 1.9, 1)], vsize: 300 };
    const summary = summarizeTransaction(tx);
    expect(summary.kind).toBe("privacy");
    expect(summary.label).toBe("Privacy pool created");
    expect(summary.tags).not.toContain("IPFS memo");
  });

  it("reads a C6 deposit and its amount from the witness", () => {
    const tx = {
      vin: [stateIn(c6Witness("01", "00e8764817")), reserveIn(1000), { txid: "f", vout: 0, value: 1000.1, address: A }],
      vout: [state(), reserve(2000)],
      vsize: 6000,
    };
    const summary = summarizeTransaction(tx);
    expect(summary.label).toBe("Privacy deposit");
    expect(summary.moved).toEqual({ asset: "XNA", amount: 100000000000n });
  });

  it("reads C6 transfers, joins and withdrawals", () => {
    const base = { vin: [null, reserveIn(2100)], vout: [state(), reserve(1800), pay(B, 300, 2)], vsize: 6000 };
    const run = (form) => summarizeTransaction({ ...base, vin: [stateIn(c6Witness(form)), reserveIn(2100)] });
    expect(run("04").label).toBe("Private transfer");
    expect(run("04").moved).toBe(null);
    expect(run("08").label).toBe("Private join");
    expect(run("06").label).toBe("Privacy withdrawal");
    expect(run("06").moved).toEqual({ asset: "XNA", amount: 30000000000n });
  });

  it("reads C4 operations from the witness size and the reserve", () => {
    const w8 = ["10", "eb99", "a", "b", "c", "d", "e", "f"];
    const w7 = ["10", "d801", "a", "b", "c", "d", "e"];
    const deposit = summarizeTransaction({ vin: [stateIn(w8), reserveIn(5000)], vout: [state(), reserve(5500)], vsize: 5000 });
    expect(deposit.label).toBe("Privacy deposit");
    expect(deposit.moved).toEqual({ asset: "XNA", amount: 50000000000n });
    const transfer = summarizeTransaction({ vin: [stateIn(w8), reserveIn(5000)], vout: [state(), reserve(5000)], vsize: 5000 });
    expect(transfer.label).toBe("Private transfer");
    //Full withdrawal: the reserve does not come back
    const out = summarizeTransaction({ vin: [stateIn(w7), reserveIn(1)], vout: [state(), pay(B, 1, 1)], vsize: 5000 });
    expect(out.label).toBe("Privacy withdrawal");
    expect(out.moved).toEqual({ asset: "XNA", amount: 100000000n });
  });

  it("names the asset of an asset pool", () => {
    const tx = {
      vin: [stateIn(c6Witness("06")), { txid: "res", vout: 1, value: 0, address: R, txinwitness: ["00", "0052c420"] }],
      vout: [state("ORBIT#POOL"), asset("transfer_asset", R, "ORBIT", 27, 1), asset("transfer_asset", B, "ORBIT", 3, 2)],
      vsize: 6000,
    };
    expect(summarizeTransaction(tx).moved).toBe(null);
    const known = summarizeTransaction(tx, { "res:1": { asset: { name: "ORBIT", amount: 30 } } });
    expect(known.moved).toEqual({ asset: "ORBIT", amount: 300000000n });
  });

  it("does not take a #POOL token on an ordinary address for a pool", () => {
    const tx = {
      vin: [{ txid: "a", vout: 0, value: 1, address: A }],
      vout: [state("RWAX#POOL", "76a914" + "00".repeat(20) + "88acc0"), pay(A, 0.9, 1)],
      vsize: 300,
    };
    expect(summarizeTransaction(tx).kind).not.toBe("privacy");
  });
});
