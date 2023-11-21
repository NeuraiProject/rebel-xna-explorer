import { ITransaction } from "./ITransaction";


export function getFee(transaction: ITransaction): number | string {
  let inputValue = 0;
  let outputValue = 0;

  type TransactionValue = { value: number; };

  const isCoinbaseTransaction = !!transaction.vin[0].coinbase;

  if (isCoinbaseTransaction === true) {
    return "Coinbase transaction, no fee";
  }
  transaction.vin.map(
    (input: TransactionValue) => (inputValue += input.value || 0)
  );
  transaction.vout.map(
    (output: TransactionValue) => (outputValue += output.value)
  );

  const fee = inputValue - outputValue;
  return fee;
}
