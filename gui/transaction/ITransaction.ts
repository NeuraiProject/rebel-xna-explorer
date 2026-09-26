import { Amount } from "../amount";

export interface ITransaction {
  blocktime?: number;
  height?: number;
  confirmations?: number;
  vin: { value?: Amount; coinbase?: string; txid?: string; vout?: number; address?: string }[];
  vout: { value: Amount; n?: number; scriptPubKey?: any }[];
}
