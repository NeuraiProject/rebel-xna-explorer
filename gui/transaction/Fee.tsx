import * as React from "react";
import { Table } from "@nextui-org/react";
import { useNeuraiUSD } from "../useNeuraiUSD";
import { ITransaction } from "./ITransaction";
import { getFee } from "./getFee";

export function Fee({
  baseCurrency, transaction,
}: {
  baseCurrency: string;
  transaction: ITransaction;
}) {
  const xnaUsdRate = useNeuraiUSD();
  const fee = getFee(transaction);

  let usdDisplayValue = "";
  if (typeof fee === "number" && xnaUsdRate) {
    usdDisplayValue = "" + fee * xnaUsdRate;
  }

  if (baseCurrency !== "XNA") {
    return (
      <Table style={{ tableLayout: "fixed" }}>
        <Table.Header>
          <Table.Column>Fee {baseCurrency}</Table.Column>
        </Table.Header>
        <Table.Body>
          <Table.Row>
            <Table.Cell>{fee}</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
    );
  } else if (baseCurrency === "XNA") {
    return (
      <Table style={{ tableLayout: "fixed" }}>
        <Table.Header>
          <Table.Column>Fee {baseCurrency}</Table.Column>
          <Table.Column>Fee USD</Table.Column>
        </Table.Header>
        <Table.Body>
          <Table.Row>
            <Table.Cell>{fee}</Table.Cell>
            <Table.Cell> {usdDisplayValue}</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
    );
  }
}
