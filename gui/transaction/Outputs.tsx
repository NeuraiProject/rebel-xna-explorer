import * as React from "react";
import { ITransaction } from "./ITransaction";
import { Table } from "../components";
import { formatAmount } from "../amount";

export function Outputs({ transaction }: { transaction: ITransaction }) {
  if (!transaction) {
    return null;
  }
  return (
    <div className="outputs-table">
    <Table style={{ tableLayout: "fixed" }}>
      <Table.Header>
        <Table.Column>Address</Table.Column>
        <Table.Column>Value</Table.Column>
      </Table.Header>
      <Table.Body>
        {transaction.vout.map((item: any, index:number) => {
          const url = "/address/";
          const key = "output_" + (item.n ?? index);

          if (
            !item.scriptPubKey.addresses ||
            item.scriptPubKey.addresses.length === 0
          ) {
            return (
              <Table.Row key={key}>
                <Table.Cell>
                 OP RETURN
                </Table.Cell>
                <Table.Cell>nulldata</Table.Cell>
              </Table.Row>
            );
          }
          const addy = item.scriptPubKey.addresses[0];

          let amount = formatAmount(item.value);
          const asset = item.scriptPubKey.asset;

          if (asset) {
            amount = formatAmount(asset.amount) + " " + asset.name;
          }
          return (
            <Table.Row key={key}>
              <Table.Cell>
                <a href={url + addy}>{addy}</a>
              </Table.Cell>
              <Table.Cell>{amount}</Table.Cell>
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table>
    </div>
  );
}
