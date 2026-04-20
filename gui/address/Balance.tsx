import * as React from "react";
import { Table } from "../components";
import { MyCard } from "../MyCard";
import { IBalanceProps, getTwoDecimalTrunc } from "./Address";

interface IBalanceWithAssetsProps extends IBalanceProps {
  assets?: any[];
}

export function Balance({
  balance,
  baseCurrency,
  xnaUsdRate,
  assets = [],
}: IBalanceWithAssetsProps) {
  const balanceAmount = balance / 100000000;
  const xnaDisplay = getTwoDecimalTrunc(balanceAmount).toLocaleString();
  const usdDisplay =
    baseCurrency === "XNA" && xnaUsdRate
      ? getTwoDecimalTrunc(balanceAmount * xnaUsdRate).toLocaleString()
      : null;

  const assetRows = (assets || [])
    .map((asset) => {
      const name = asset.assetName;
      const amount = asset.balance / 100000000;
      return { name, amount };
    })
    .filter((a) => a.amount !== 0);

  const body = (
    <Table striped sticked>
      <Table.Header>
        <Table.Column>Asset</Table.Column>
        <Table.Column>Amount</Table.Column>
      </Table.Header>
      <Table.Body>
        <Table.Row key="__xna__">
          <Table.Cell>
            <strong>XNA</strong>
            {usdDisplay && (
              <span style={{ marginLeft: 8, color: "var(--text-muted)" }}>
                (${usdDisplay})
              </span>
            )}
          </Table.Cell>
          <Table.Cell>{xnaDisplay}</Table.Cell>
        </Table.Row>
        <Table.Row key="__assets_header__">
          <Table.Cell>
            <strong>Assets</strong>
          </Table.Cell>
          <Table.Cell></Table.Cell>
        </Table.Row>
        {assetRows.map((a) => (
          <Table.Row key={a.name}>
            <Table.Cell>{a.name}</Table.Cell>
            <Table.Cell>
              {getTwoDecimalTrunc(a.amount).toLocaleString()}
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );

  return <MyCard header="Balance" body={body} />;
}
