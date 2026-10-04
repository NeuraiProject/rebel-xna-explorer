import * as React from "react";
import { Table } from "../components";
import { MyCard } from "../MyCard";
import { IBalanceProps } from "./Address";
import { formatRawSatoshis, rawSatoshis } from "../amount";

interface IBalanceWithAssetsProps extends IBalanceProps {
  assets?: any[];
}

export function Balance({
  balance,
  baseCurrency,
  xnaUsdRate,
  assets = [],
}: IBalanceWithAssetsProps) {
  const xnaDisplay = formatRawSatoshis(balance);
  const usdDisplay =
    baseCurrency === "XNA" && xnaUsdRate
      ? ((Number(balance) / 1e8) * xnaUsdRate).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : null;

  //getaddressbalance with includeAssets lists XNA too, it already has its own row
  const assetRows = (assets || [])
    .filter((asset) => asset.assetName !== "XNA")
    .filter((asset) => rawSatoshis(asset.balance) !== 0n)
    .map((asset) => ({
      name: asset.assetName,
      amount: formatRawSatoshis(asset.balance),
    }));

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
            <Table.Cell>{a.amount}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );

  return <MyCard header="Balance" body={body} />;
}
