import { Avatar, Link } from "./components";
import * as React from "react";
import useAssetData from "./useAssetData";

export function AssetImageLink({ assetName, gatewayURL }) {
  const asset = useAssetData(assetName);

  if (!asset) {
    return null;
  }

  if (asset.ipfs_hash) {
    return (
      <Link href={gatewayURL + asset.ipfs_hash} target="_blank">
        <Avatar
          size="md"
          squared
          src={"/thumbnail?assetName=" + encodeURIComponent(assetName)}
        />
      </Link>
    );
  }

  return null;
}
