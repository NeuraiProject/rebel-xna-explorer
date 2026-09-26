import { toSatoshis } from "../amount";
import { ITransaction } from "./ITransaction";

//Returns the fee in satoshis
export function getFee(transaction: ITransaction): bigint | string {
  const isCoinbaseTransaction = !!transaction.vin[0].coinbase;

  if (isCoinbaseTransaction === true) {
    return "Coinbase transaction, no fee";
  }
  const inputValue = transaction.vin.reduce(
    (sum, input) => sum + toSatoshis(input.value),
    0n
  );
  const outputValue = transaction.vout.reduce(
    (sum, output) => sum + toSatoshis(output.value),
    0n
  );

  return inputValue - outputValue;
}
