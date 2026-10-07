import { beforeEach, describe, expect, it, vi } from "vitest";

//No config file and no node: only the asset reads below are answered
vi.mock("./getConfig.js", () => ({
  default: () => ({ neurai_url: "http://127.0.0.1:9/rpc", neurai_username: "test", neurai_password: "test" }),
}));
vi.mock("./blockchain.js", async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    default: {
      ...original.default,
      getAssetData: vi.fn(),
      listAssetsVerbose: vi.fn(async () => ({})),
      getAddressesByAsset: vi.fn(),
      listAssetNames: vi.fn(),
    },
  };
});

import blockchain from "./blockchain.js";
import { getAssetDetail } from "./explorer.js";

//What getAddressesByAsset throws for the node's string answers, and what the
//RPC library rejects with when wallet-services refuses a read
const notAValidAssetName = () => new Error("_Not a valid asset name");
const noAssetIndex = () =>
  new Error("_This rpc call is not functional unless -assetindex is enabled. To enable, please run the wallet with -assetindex, this will require a reindex to occur");
const serviceBusy = () => ({ status: 503, statusText: "Service Unavailable", error: { error: "node busy" } });

function asset(name) {
  return { name, amount: 1000, units: 0, reissuable: 1, has_ipfs: 0 };
}

beforeEach(() => {
  blockchain.getAssetData.mockImplementation(async (name) => asset(name));
  blockchain.listAssetNames.mockImplementation(async () => []);
});

describe("isInvalidAssetName", () => {
  it("matches only the node's answer for a name that cannot exist", () => {
    expect(blockchain.isInvalidAssetName(notAValidAssetName())).toBe(true);
    expect(blockchain.isInvalidAssetName(noAssetIndex())).toBe(false);
    expect(blockchain.isInvalidAssetName(serviceBusy())).toBe(false);
    expect(blockchain.isInvalidAssetName("_Not a valid asset name")).toBe(false);
  });
});

describe("getAssetDetail: parts that could not be read", () => {
  it("a restricted asset has no owner token: nothing is reported missing", async () => {
    blockchain.getAddressesByAsset.mockImplementation(async (name) => {
      if (name === "$SECURE!") throw notAValidAssetName();
      return { NholderAddress: 1000 };
    });
    const detail = await getAssetDetail("$SECURE");
    expect(detail.owner).toBe(null);
    expect(detail.holderCount).toBe(1);
    expect(detail.unavailable).toEqual([]);
  });

  it("a node without -assetindex: the owner and the holders are reported missing", async () => {
    blockchain.getAddressesByAsset.mockImplementation(async () => {
      throw noAssetIndex();
    });
    const detail = await getAssetDetail("NOINDEX");
    expect(detail.owner).toBe(null);
    expect(detail.holderCount).toBe(null);
    expect(detail.unavailable).toEqual(expect.arrayContaining(["owner", "holders"]));
  });

  it("a refused owner read is reported, not taken for a missing owner token", async () => {
    blockchain.getAddressesByAsset.mockImplementation(async (name) => {
      if (name === "BUSY!") throw serviceBusy();
      return { NholderAddress: 1000 };
    });
    const detail = await getAssetDetail("BUSY");
    expect(detail.owner).toBe(null);
    expect(detail.unavailable).toEqual(["owner"]);
  });

  it("a refused list is null and named, not an empty list", async () => {
    blockchain.getAddressesByAsset.mockImplementation(async (name) => (name === "SILVER!" ? { NownerAddress: 1 } : { NholderAddress: 5 }));
    blockchain.listAssetNames.mockImplementation(async (pattern) => {
      if (pattern === "SILVER/*") throw serviceBusy();
      return [];
    });
    const detail = await getAssetDetail("SILVER");
    expect(detail.owner).toEqual({ address: "NownerAddress", amount: expect.anything() });
    expect(detail.subAssets).toBe(null);
    expect(detail.uniques).toEqual([]);
    expect(detail.unavailable).toEqual(["subAssets"]);
  });
});
