import * as React from "react";
import { Spacer } from "@nextui-org/react";
import { MyCard } from "../MyCard";
import { IBalanceProps, formatNumber } from "./Address";

export function Balance({ balance, baseCurrency, rvnUsdRate }: IBalanceProps) {
  const balanceAmount = balance / 100000000;
  if (baseCurrency === "RVN" && rvnUsdRate) {
    const rvn = (
      <MyCard header="RVN" body={formatNumber(balanceAmount)}></MyCard>
    );
    const usd = (
      <MyCard
        header="USD"
        body={formatNumber(balanceAmount * rvnUsdRate)}
      ></MyCard>
    );
    const tutti = (
      <div>
        {rvn}
        <Spacer />
        {usd}
      </div>
    );

    return <MyCard header="Balance" body={tutti} />;
  }

  return <MyCard header="Balance" body={formatNumber(balanceAmount)}></MyCard>;
}
