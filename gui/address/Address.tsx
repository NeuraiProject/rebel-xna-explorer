import * as React from "react";
import axios from "axios";

import { getParam } from "../getParam";
import { Spacer } from "../components";
import { MyCard } from "../MyCard";
import { useNeuraiUSD } from "../useNeuraiUSD";
import { useConfig } from "../useConfig";
import { useFetch } from "../useFetch";
import { Balance } from "./Balance";
import { Received } from "./Received";
import { Unspent } from "./Unspent";
import { AssetTable } from "./AssetTable";
import { History } from "./History";

export function Address() {
  const address = getParam("address");

  const config = useConfig();
  const unspent = useFetch("/api/getaddressutxos/" + address);
  const data = useFetch("/api/addresses/" + address);
  const xnaUsdRate = useNeuraiUSD();

  if (!data) {
    console.log("data data is nothing");
    return null;
  }

  let header = "UTXOs";

  if (unspent) {
    header = header + " " + unspent.length.toLocaleString();
  }

  return (
    <div className="form-group">
      <MyCard header="Address" body={address} />
      <Spacer />
      <Balance
        balance={data.balance}
        baseCurrency={config ? config.baseCurrency : ""}
        xnaUsdRate={xnaUsdRate}
      />
      <Spacer></Spacer>
      <Received
        baseCurrency={config ? config.baseCurrency : ""}
        received={data.received}
        xnaUsdRate={xnaUsdRate}
      ></Received>

      <Spacer></Spacer>
      <MyCard header="Assets" body={<AssetTable assets={data.assets} />} />

      <Spacer></Spacer>

      <MyCard header="History" body={<History address={address} />} />

      <Spacer></Spacer>
      <MyCard
        header={header}
        body={<Unspent address={address} unspent={unspent} />}
      />
    </div>
  );
}
export interface IReceivedProps {
  baseCurrency: string;
  received: number;
  xnaUsdRate: number | null;
}
export interface IBalanceProps {
  baseCurrency: string;
  balance: number;
  xnaUsdRate: number | null;
}

export function formatNumber(num: number) {
  if (num === 0) {
    return 0;
  }
  if (!num) {
    return null;
  }

  if (typeof num !== "number") {
    return null;
  }

  num = Number(num.toFixed(2));
  const numberString = num.toLocaleString();
  return <div>{numberString}</div>;
}

interface IBalance {
  balance: number;
  received: number;
  assets: any[];
}
export function getTwoDecimalTrunc(num: number) {
  //Found answer here https://stackoverflow.com/questions/11832914/how-to-round-to-at-most-2-decimal-places-if-necessary
  //In JavaScript the number 77866.98 minus 111 minus 0.2 equals 77755.95999999999
  //We want it to be 77755.96
  return Math.trunc(num * 100) / 100;
}
