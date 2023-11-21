export interface ITransaction {
  blocktime: number;
  vin: { value: number; coinbase?: boolean }[];
  vout: { value: number; scriptPubKey?: any }[];
}
