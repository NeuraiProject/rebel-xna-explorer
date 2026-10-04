import * as React from "react";
import axios from "axios";
import { Amount } from "./amount";
const assetDataCache: { [url: string]: Promise<IAsset | null> } = {};

/*
    When fetching asset data, lets save/cache the promise.
    We reuse the promise, that is we cache the response.
    Failed requests are dropped from the cache so the next caller asks again.
*/

export interface IAsset {
  name: string;
  amount: Amount;
  units: number;
  reissuable: number;
  has_ipfs: number;
  ipfs_hash: string;
}

function getAssetDataCached(assetName: string): Promise<IAsset | null> {
  const name = encodeURIComponent(assetName);
  const URL = "/api/assetdata/" + name;

  if (!assetDataCache[URL]) {
    assetDataCache[URL] = axios.get(URL).then((r) => r.data || null);
    assetDataCache[URL].catch(() => delete assetDataCache[URL]);
  }
  return assetDataCache[URL];
}

//undefined while loading, null when the asset can not be found
export default function useAssetData(assetName: string) {
  const [meta, setMeta] = React.useState<IAsset | null | undefined>(undefined);

  React.useEffect(() => {
    let cancelled = false;
    setMeta(undefined);
    getAssetDataCached(assetName)
      .then((a) => {
        if (!cancelled) setMeta(a);
      })
      .catch(() => {
        if (!cancelled) setMeta(null);
      });
    return () => {
      cancelled = true;
    };
  }, [assetName]);
  return meta;
}
