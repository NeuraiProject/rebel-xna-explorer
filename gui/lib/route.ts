/*
  Path based routes. Every page is a real URL that the server answers with
  index.html, so links can be shared, bookmarked and opened in a new tab.
*/

export type Route =
  | { name: "home" }
  | { name: "blocks" }
  | { name: "block"; id: string }
  | { name: "tx"; id: string }
  | { name: "address"; id: string }
  | { name: "assets" }
  | { name: "asset"; id: string }
  | { name: "mempool" }
  | { name: "notfound" };

export function resolveRoute(pathname: string): Route {
  const segments = pathname.split("/").filter(Boolean).map((segment) => {
    try {
      return decodeURIComponent(segment);
    } catch {
      return segment;
    }
  });
  if (segments.length === 0) return { name: "home" };
  const [first, ...rest] = segments;
  const id = rest.join("/");
  switch (first) {
    case "blocks":
      return { name: "blocks" };
    case "block":
    case "blockhash":
      return id ? { name: "block", id } : { name: "blocks" };
    case "tx":
      return id ? { name: "tx", id } : { name: "notfound" };
    case "address":
      return id ? { name: "address", id } : { name: "notfound" };
    case "assets":
      return { name: "assets" };
    case "asset":
      return id ? { name: "asset", id } : { name: "assets" };
    case "mempool":
      return { name: "mempool" };
    default:
      return { name: "notfound" };
  }
}

export const paths = {
  home: () => "/",
  blocks: (before?: number) => (before ? "/blocks?before=" + before : "/blocks"),
  //Heights are shorter and say more than hashes
  block: (heightOrHash: number | string) => "/block/" + encodeURIComponent(String(heightOrHash)),
  tx: (txid: string, from?: string | null) =>
    "/tx/" + encodeURIComponent(txid) + (from ? "?from=" + encodeURIComponent(from) : ""),
  address: (address: string) => "/address/" + encodeURIComponent(address),
  assets: () => "/assets",
  asset: (name: string) => "/asset/" + encodeURIComponent(name),
  mempool: () => "/mempool",
};

export function getSearchParam(name: string): string | null {
  return new URLSearchParams(window.location.search).get(name);
}

/** Changes the query string without loading the page again */
export function setSearchParams(values: Record<string, string | number | null | undefined>) {
  const params = new URLSearchParams(window.location.search);
  for (const [key, value] of Object.entries(values)) {
    if (value === null || value === undefined || value === "") params.delete(key);
    else params.set(key, String(value));
  }
  const query = params.toString();
  const url = window.location.pathname + (query ? "?" + query : "") + window.location.hash;
  window.history.replaceState(null, "", url);
}
