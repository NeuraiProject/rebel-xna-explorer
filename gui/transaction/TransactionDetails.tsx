import * as React from "react";
import { MyCard } from "../MyCard";
import { Table } from "@nextui-org/react";
import { Fee } from "./Fee";

export function TransactionDetails({ config, transaction }) {
  return (
    <MyCard
      header={"Transaction details"}
      body={<div>
        <Table style={{ tableLayout: "fixed" }}>
          <Table.Header>
            <Table.Column>Local time</Table.Column>
            <Table.Column>ISO time</Table.Column>
          </Table.Header>
          <Table.Body>
            <Table.Row>
              <Table.Cell>
                {new Date(transaction.blocktime * 1000).toLocaleString()}
              </Table.Cell>
              <Table.Cell>
                {new Date(transaction.blocktime * 1000).toISOString()}
              </Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>

        <Table style={{ tableLayout: "fixed" }}>
          <Table.Header>
            <Table.Column>Transaction Inputs</Table.Column>
            <Table.Column>Transaction Outputs</Table.Column>
          </Table.Header>
          <Table.Body>
            <Table.Row>
              <Table.Cell>{transaction.vin.length}</Table.Cell>
              <Table.Cell> {transaction.vout.length}</Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>

        <Fee
          transaction={transaction}
          baseCurrency={config ? config.baseCurrency : ""} />
      </div>} />
  );
}
