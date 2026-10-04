import * as React from "react";
import { useConfig } from "./useConfig";

export function Meta({ asset }) {
  const config = useConfig();
  const ipfs = asset.ipfs_hash;
  const gateway = config?.ipfs_gateway || "https://ipfs.io/ipfs/";

  return (
    <>
      <pre>{JSON.stringify(asset, null, 4)}</pre>
      {ipfs && (
        <div
          style={{
            textAlign: "center",
          }}
        >
          <a href={gateway + ipfs} target="_blank" rel="noopener">
            IPFS link
            <br />
            <img
              width="200"
              src={"/thumbnail?assetName=" + encodeURIComponent(asset.name)}
            />
          </a>
        </div>
      )}
    </>
  );
}
