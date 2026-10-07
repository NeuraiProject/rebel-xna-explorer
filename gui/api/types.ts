/*
  Shapes of the explorer API (see explorer.js). Amounts are decimal strings.
*/

export type Decimal = string;

export interface Settings {
  baseCurrency: string;
  headline: string;
  theme: "light" | "dark" | string;
  ipfs_gateway: string;
  price_lookup_enabled: boolean;
  network: "main" | "test" | "regtest" | null;
  version?: string;
}

export interface Price {
  usd: number;
  change24h: number | null;
}

export interface Stats {
  chain: string;
  height: number;
  /**
   * mined: from the emission schedule, checked against the newest block.
   * circulating: the node's UTXO set (gettxoutsetinfo), when the RPC allows it.
   */
  supply: {
    mined: Decimal | null;
    max: Decimal | null;
    share: number | null;
    subsidy: Decimal | null;
    circulating: { amount: Decimal; height: number | null } | null;
  } | null;
  headers: number;
  bestBlockHash: string;
  difficulty: number;
  hashrate: number | null;
  avgBlockTime: number | null;
  txRate: number | null;
  txCount: number | null;
  mempool: { size: number; bytes: number } | null;
  price: Price | null;
}

export interface BlockSummary {
  height: number;
  hash: string;
  time: number;
  txCount: number;
  size: number;
}

export interface BlockList {
  tip: number;
  blocks: BlockSummary[];
}

export interface BlockDetail {
  hash: string;
  height: number;
  confirmations: number;
  time: number;
  mediantime: number;
  size: number;
  strippedsize: number;
  weight: number;
  version: number;
  versionHex: string;
  merkleroot: string;
  nonce: number;
  bits: string;
  difficulty: number;
  chainwork: string;
  previousblockhash: string | null;
  nextblockhash: string | null;
  txCount: number;
  reward: Decimal;
  fees: Decimal | null;
  subsidy: Decimal | null;
  totalOut: Decimal | null;
  tip: number;
  raw: unknown;
}

export type TxKind =
  | "coinbase"
  | "payment"
  | "asset-transfer"
  | "asset-issue"
  | "asset-reissue"
  | "qualifier"
  | "depin"
  | "privacy"
  | "data";

export interface PoolInfo {
  name: string;
  action: "create" | "deposit" | "withdrawal" | "transfer" | "join" | "operation";
  asset: string;
  amount: Decimal | null;
}

export interface MovedAmount {
  asset: string;
  amount: Decimal;
}

export interface TxSummary {
  txid: string;
  kind: TxKind;
  label: string;
  tags: string[];
  inputs: number;
  outputs: number;
  totalOut: Decimal;
  fee: Decimal | null;
  feeRate: number | null;
  moved: MovedAmount | null;
  pool: PoolInfo | null;
  size: number;
  vsize: number;
  height: number | null;
  time: number | null;
  confirmations: number;
  pending: boolean;
  firstSeen?: number;
}

export interface Paged<T> {
  total: number;
  page: number;
  size: number;
  pages: number;
  items: T[];
}

export interface TxInput {
  coinbase: boolean;
  coinbaseHex: string | null;
  txid: string | null;
  vout: number | null;
  address: string | null;
  value: Decimal | null;
  asset: { name: string; amount: Decimal } | null;
}

export interface TxOutput {
  n: number;
  type: string;
  address: string | null;
  value: Decimal;
  asset: { name: string; amount: Decimal; message: string | null } | null;
  data: string | null;
  dataText: string | null;
  change: boolean;
  burn: boolean;
  spent: { txid: string; index: number; height: number | null } | null;
  spentKnown: boolean;
}

export interface TxDetail {
  txid: string;
  hash: string;
  version: number;
  size: number;
  vsize: number;
  locktime: number;
  pending: boolean;
  blockhash: string | null;
  height: number | null;
  confirmations: number;
  time: number | null;
  firstSeen: number | null;
  kind: TxKind;
  label: string;
  tags: string[];
  fee: Decimal | null;
  feeRate: number | null;
  totalIn: Decimal | null;
  totalOut: Decimal;
  assetsIn: MovedAmount[];
  assetsOut: MovedAmount[];
  moved: MovedAmount | null;
  pool: PoolInfo | null;
  inputs: TxInput[];
  outputs: TxOutput[];
  raw: unknown;
}

export interface Mempool {
  size: number;
  bytes: number;
  items: TxSummary[];
}

export interface Recent {
  pending: TxSummary[];
  confirmed: TxSummary[];
}

export interface AddressSummary {
  address: string;
  family: string;
  familyLabel: string;
  burn: boolean;
  balance: Decimal;
  received: Decimal;
  sent: Decimal;
  assets: { name: string; type: AssetType; balance: Decimal }[];
  pending: MovedAmount[];
  txCount: number;
  first: { height: number; time: number | null } | null;
  last: { height: number; time: number | null } | null;
}

export interface HistoryItem {
  txid: string;
  height: number;
  time: number | null;
  assets: MovedAmount[];
}

export interface AddressHistory extends Paged<HistoryItem> {
  filter: "all" | "xna" | "assets";
  pending: { txid: string; time: number | null; assets: MovedAmount[] }[];
  chart: { height: number; balance: Decimal }[] | null;
}

export interface Utxo {
  txid: string;
  index: number;
  asset: string;
  amount: Decimal;
  height: number | null;
  confirmations: number;
}

export type AssetType = "main" | "sub" | "unique" | "qualifier" | "restricted" | "depin" | "owner" | "channel";

export interface AssetListItem {
  name: string;
  type: AssetType;
  typeLabel: string;
  amount: Decimal;
  units: number;
  reissuable: boolean;
  hasIpfs: boolean;
  ipfsHash: string | null;
  height: number | null;
  blockhash: string | null;
  holders: number | null;
}

export interface AssetList extends Paged<AssetListItem> {
  counts: Partial<Record<AssetType | "all", number>>;
}

export interface AssetDetail {
  name: string;
  type: AssetType;
  typeLabel: string;
  amount: Decimal;
  units: number;
  reissuable: boolean;
  hasIpfs: boolean;
  ipfsHash: string | null;
  height: number | null;
  blockhash: string | null;
  issueTxid: string | null;
  owner: { address: string; amount: Decimal } | null;
  holderCount: number | null;
  parent: string | null;
  /** null: could not be read (listed in `unavailable`) */
  subAssets: string[] | null;
  uniques: string[] | null;
  /** Parts the server could not read this time, e.g. the RPC service was busy */
  unavailable: AssetDetailPart[];
  raw: unknown;
}

export type AssetDetailPart = "owner" | "holders" | "issueTx" | "subAssets" | "uniques";

export interface AssetHolders extends Paged<{ rank: number; address: string; amount: Decimal; share: number | null }> {
  supply: Decimal;
  owner: { address: string; amount: Decimal } | null;
}

export interface FeeRateSpread {
  median: number;
  min: number;
  max: number;
}

export interface StripBlock extends BlockSummary {
  weight: number;
  mix: { coinbase: number; payment: number; asset: number; privacy: number; other: number };
  assetCreated: boolean;
  privacy: boolean;
  fees: Decimal | null;
  feeRate: FeeRateSpread | null;
  reward: Decimal;
}

export interface ChainStrip {
  tip: { height: number; time: number };
  avgBlockTime: number | null;
  mempool: { count: number; bytes: number; fees: Decimal; feeRate: FeeRateSpread | null };
  blocks: StripBlock[];
}
