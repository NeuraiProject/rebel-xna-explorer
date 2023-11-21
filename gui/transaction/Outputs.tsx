import * as React from "react";
import { ITransaction } from "./ITransaction";
import { Table } from "@nextui-org/react";

export function Outputs({ transaction }: { transaction: ITransaction }) {
  if (!transaction) {
    return null;
  }
  return (
    <Table style={{ tableLayout: "fixed" }}>
      <Table.Header>
        <Table.Column>Address</Table.Column>
        <Table.Column>Value</Table.Column>
      </Table.Header>
      <Table.Body>
        {transaction.vout.map((item: any, index:number) => {
          const url = "/index.html?route=ADDRESS&address=";
 
          if (
            !item.scriptPubKey.addresses ||
            item.scriptPubKey.addresses.length === 0
          ) {
            return (
              <Table.Row>
                <Table.Cell>
                 OP RETURN
                </Table.Cell>
                <Table.Cell>nulldata</Table.Cell>
              </Table.Row>
            );
          }
          const addy = item.scriptPubKey.addresses[0];

          let amount = item.value.toLocaleString();
          const asset = item.scriptPubKey.asset;

          if (asset) {
            amount = asset.amount.toLocaleString() + " " + asset.name;
          }
          return (
            <Table.Row>
              <Table.Cell>
                <a href={url + addy}>{addy}</a>
              </Table.Cell>
              <Table.Cell>{amount}</Table.Cell>
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table>
  );
}
