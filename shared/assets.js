/*
  What kind of asset a name is. The kind is written in the name itself, so no
  lookup is needed: NAME!, #NAME, $NAME, &NAME, PARENT/CHILD, PARENT#TAG.
*/

/**
 * @typedef {"main" | "sub" | "unique" | "qualifier" | "restricted" | "depin" | "owner" | "channel"} AssetType
 */

/** @type {Record<AssetType, string>} */
export const ASSET_TYPE_LABELS = {
  main: "Main asset",
  sub: "Sub-asset",
  unique: "Unique token",
  qualifier: "Qualifier",
  restricted: "Restricted",
  depin: "DePIN",
  owner: "Owner token",
  channel: "Message channel",
};

/**
 * @param {string} name
 * @returns {AssetType}
 */
export function assetType(name) {
  const text = String(name || "");
  if (text.endsWith("!")) return "owner";
  if (text.startsWith("#")) return "qualifier";
  if (text.startsWith("$")) return "restricted";
  if (text.startsWith("&")) return "depin";
  if (text.includes("~")) return "channel";
  if (text.includes("#")) return "unique";
  if (text.includes("/")) return "sub";
  return "main";
}

/**
 * The asset a sub-asset, unique token or owner token belongs to.
 * @param {string} name
 * @returns {string | null}
 */
export function parentAsset(name) {
  const text = String(name || "");
  if (text.endsWith("!")) return text.slice(0, -1);
  const body = text.replace(/^[#$&]/, "");
  let cut = Math.max(body.lastIndexOf("/"), body.lastIndexOf("#"), body.lastIndexOf("~"));
  //A sub-qualifier is written #PARENT/#CHILD: the separator is "/#"
  if (body[cut] === "#" && body[cut - 1] === "/") cut -= 1;
  if (cut <= 0) return null;
  return text.slice(0, text.length - body.length) + body.slice(0, cut);
}
