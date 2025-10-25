import * as React from "react";
import { Spacer } from "../components";
import { MyCard } from "../MyCard";
import { IBalanceProps, formatNumber } from "./Address";

export function Balance({ balance, baseCurrency, xnaUsdRate }: IBalanceProps) {
  const balanceAmount = balance / 100000000;
  if (baseCurrency === "XNA" && xnaUsdRate) {
    const xna = (
      <MyCard header="XNA" body={formatNumber(balanceAmount)}></MyCard>
    );
    const usd = (
      <MyCard
        header="USD"
        body={formatNumber(balanceAmount * xnaUsdRate)}
      ></MyCard>
    );
    const tutti = (
      <div>
        {xna}
        <Spacer />
        {usd}
      </div>
    );

    return <MyCard header="Balance" body={tutti} />;
  }

  return <MyCard header="Balance" body={formatNumber(balanceAmount)}></MyCard>;
}
