import * as React from "react";
import { Table } from "@nextui-org/react";
import { ITransaction } from "./ITransaction";
import { useTransaction } from "./useTransaction";

export function Inputs({ transaction }: { transaction: ITransaction }) {
  const url = "/index.html?route=ADDRESS&address=";

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
              let value = 0;
              transaction.vout.map((out) => (value += out.value));
              return (
                <Table.Row key={"input" + Math.random()}>
                  <Table.Cell>Coinbase</Table.Cell>
                  <Table.Cell>{value}</Table.Cell>
                </Table.Row>
              );
            }
            return (
              <Table.Row key={"input_" + item.address}>
                <Table.Cell>
                  <a href={url + item.address}>{item.address}</a>
                </Table.Cell>
                <Table.Cell>
                  {item.value === 0 ? (
                    <AssetData txid={item.txid} index={item.vout} />
                  ) : (
                    item.value.toLocaleString()
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

  const asset = utxo.scriptPubKey.asset;

  if (asset) {
    return (
      <div>
        {asset.amount} {asset.name}
      </div>
    );
  }
  return null;
}
