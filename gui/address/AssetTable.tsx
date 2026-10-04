import * as React from "react";
import { Table } from "../components";
import { formatRawSatoshis, rawSatoshis } from "../amount";

export function AssetTable({ assets }) {
  return (
    <Table striped sticked>
      <Table.Header>
        <Table.Column>Asset</Table.Column>
        <Table.Column>Amount</Table.Column>
      </Table.Header>
      <Table.Body>
        {assets.map((asset) => {
          const name = asset.assetName;

          if (rawSatoshis(asset.balance) === 0n) {
            return null;
          }
          return (
            <Table.Row key={name}>
              <Table.Cell>{name}</Table.Cell>
              <Table.Cell>{formatRawSatoshis(asset.balance)}</Table.Cell>
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table>
  );
}
