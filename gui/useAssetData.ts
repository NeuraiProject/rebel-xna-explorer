import * as React from "react";
import axios from "axios";
const assetDataCache = {};

/*
    When fetching asset data, lets save/cache the promise.
    We reuse the promise, that is we cache the response
*/

export interface IAsset {
  name: string;
  amount: number;
  units: number;
  reissuable: number;
  has_ipfs: number;
  ipfs_hash: string;
}

async function getAssetDataCached(assetName: string): Promise<IAsset> {
  const name = encodeURIComponent(assetName);
  const URL = "/api/assetdata/" + name;
  let promise = assetDataCache[URL];

  if (!promise) {
    promise = axios.get(URL);
    assetDataCache[URL] = promise;
  }
  const axiosResponse = await promise;
  return axiosResponse.data;
}

export default function useAssetData(assetName: string) {
  const [meta, setMeta] = React.useState<IAsset | null>(null);

  React.useEffect(() => {
    const promise = getAssetDataCached(assetName);
    promise.then((a) => setMeta(a));
  }, []);
  return meta;
}
