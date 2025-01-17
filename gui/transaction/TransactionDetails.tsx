import * as React from "react";
import { MyCard } from "../MyCard";
import { Table } from "@nextui-org/react";
import { Fee } from "./Fee";

export function TransactionDetails({ config, transaction }) {
  const dateISOString = transaction.blocktime
    ? new Date(transaction.blocktime * 1000).toISOString()
    : "";
  const dateLocaleString = transaction.blocktime
    ? new Date(transaction.blocktime * 1000).toLocaleString()
    : "";

  return (
    <MyCard
      header={"Transaction details"}
      body={
        <div>
          <Table style={{ tableLayout: "fixed" }}>
            <Table.Header>
              <Table.Column>Local time</Table.Column>
              <Table.Column>ISO time</Table.Column>
            </Table.Header>
            <Table.Body>
              <Table.Row>
                <Table.Cell>{dateLocaleString}</Table.Cell>
                <Table.Cell>{dateISOString}</Table.Cell>
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
            baseCurrency={config ? config.baseCurrency : ""}
          />
          <Table style={{ tableLayout: "fixed" }}>
            <Table.Header>
              <Table.Column>Block</Table.Column>
              <Table.Column>Confirmations</Table.Column>
            </Table.Header>
            <Table.Body>
              <Table.Row>
                <Table.Cell>
                  <a href={"?route=BLOCK&hash=" + transaction.blockhash}>
                    {transaction.height.toLocaleString()}
                  </a>
                </Table.Cell>
                <Table.Cell>
                  {transaction.confirmations.toLocaleString()}
                </Table.Cell>
              </Table.Row>
            </Table.Body>
          </Table>
        </div>
      }
    />
  );
}
