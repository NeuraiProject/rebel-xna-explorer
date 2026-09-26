import * as React from "react";
import { Table } from "../components";
import { formatAmount, formatSatoshis, toSatoshis } from "../amount";
import { ITransaction } from "./ITransaction";
import { useTransaction } from "./useTransaction";

export function Inputs({ transaction }: { transaction: ITransaction }) {
  const url = "/address/";

  return (
    <div>
      <Table style={{ tableLayout: "fixed" }}>
        <Table.Header>
          <Table.Column>Address</Table.Column>
          <Table.Column>Value</Table.Column>
        </Table.Header>
        <Table.Body>
          {transaction.vin.map((item: any) => {
            //If this is a coinbase transaction then the input value is the sum of all outputs
            if (item.coinbase) {
              const value = transaction.vout.reduce(
                (sum, out) => sum + toSatoshis(out.value),
                0n
              );
              return (
                <Table.Row key="input_coinbase">
                  <Table.Cell>Coinbase</Table.Cell>
                  <Table.Cell>{formatSatoshis(value)}</Table.Cell>
                </Table.Row>
              );
            }
            //Asset inputs carry 0 XNA, and value is missing without -spentindex
            const lookupPrevout = item.value === undefined || item.value === 0;
            return (
              <Table.Row key={"input_" + item.txid + "_" + item.vout}>
                <Table.Cell>
                  <a href={url + item.address}>{item.address}</a>
                </Table.Cell>
                <Table.Cell>
                  {lookupPrevout ? (
                    <AssetData txid={item.txid} index={item.vout} />
                  ) : (
                    formatAmount(item.value)
                  )}
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table>
    </div>
  );
}
function AssetData({ txid, index }: { txid: string; index: number }) {
  const transaction = useTransaction(txid);

  if (!transaction) {
    return <div>nada</div>;
  }

  const utxo = transaction.vout[index];

  if (!utxo) {
    return null;
  }
  const asset = utxo.scriptPubKey?.asset;

  if (asset) {
    return (
      <div>
        {formatAmount(asset.amount)} {asset.name}
      </div>
    );
  }
  return <div>{formatAmount(utxo.value)}</div>;
}
