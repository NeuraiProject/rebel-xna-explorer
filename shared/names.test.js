import { describe, expect, it } from "vitest";
import { assetType, parentAsset } from "./assets.js";
import { addressFamily, isBurnAddress } from "./addresses.js";

describe("assetType", () => {
  it("reads the kind from the name", () => {
    expect(assetType("RWAX")).toBe("main");
    expect(assetType("RWAX!")).toBe("owner");
    expect(assetType("RWAX/SUB")).toBe("sub");
    expect(assetType("RWAX#POOL")).toBe("unique");
    expect(assetType("#BATUCOIN")).toBe("qualifier");
    expect(assetType("$SECURE")).toBe("restricted");
    expect(assetType("&MASKOIN")).toBe("depin");
    expect(assetType("RWAX~CHAT")).toBe("channel");
  });

  it("finds the parent", () => {
    expect(parentAsset("RWAX")).toBe(null);
    expect(parentAsset("RWAX!")).toBe("RWAX");
    expect(parentAsset("RWAX/SUB")).toBe("RWAX");
    expect(parentAsset("RWAX/SUB#ONE")).toBe("RWAX/SUB");
    expect(parentAsset("#KYC/#LEVEL2")).toBe("#KYC");
  });
});

describe("addressFamily", () => {
  it("tells the four families apart on both networks", () => {
    expect(addressFamily("tNYzjPgmYKmh1bVMJiJS6AL19b5mhpiNCX")).toBe("legacy");
    expect(addressFamily("NihAfZynHrTtYPH8ZSUEhLSCVMstLSV5qN")).toBe("legacy");
    expect(addressFamily("tnq1rpqlhk9qucn28drzp33ugu2unxqf7y7qq887ll2q644739m49ph0sluj0re")).toBe("ecdsa-witness");
    expect(addressFamily("pq1z5ruu6wgf98pra84y7etr7qdnlfellpe2pmw5t3esw5dv2e50m6uqvtv3mc")).toBe("post-quantum");
    expect(addressFamily("tnc1pa4h9p3pm9ncfp3mlqtruvdhg6d5wfyg4nxkg9af6x3ltx")).toBe("authscript");
    expect(addressFamily("nq1pa4h9p3pm9ncfp3mlqtruvdhg6d5wfyg4nxkg9af6x3ltx")).toBe("old-authscript");
    expect(addressFamily("hello")).toBe("unknown");
  });

  it("spots burn addresses", () => {
    expect(isBurnAddress("tBURNXXXXXXXXXXXXXXXXXXXXXXXVZLroy")).toBe(true);
    expect(isBurnAddress("tUniqueAssetXXXXXXXXXXXXXXXXVCgpLs")).toBe(true);
    expect(isBurnAddress("tNYzjPgmYKmh1bVMJiJS6AL19b5mhpiNCX")).toBe(false);
  });
});
