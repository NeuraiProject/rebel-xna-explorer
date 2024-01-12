import * as React from "react";
import { Table } from "@nextui-org/react";
import { getTwoDecimalTrunc } from "./Address";

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
          const balance = asset.balance / 100000000;

          if (balance === 0) {
            return null;
          }
          const displayBalance = getTwoDecimalTrunc(balance).toLocaleString();
          return (
            <Table.Row key={name}>
              <Table.Cell>{name}</Table.Cell>
              <Table.Cell>{displayBalance}</Table.Cell>
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table>
  );
}
