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
import { Amount } from "../amount";

export function Address() {
  const address = getParam("address");

  const config = useConfig();
  const encodedAddress = encodeURIComponent("" + address);
  const { data: unspent, error: unspentError } = useFetch(
    "/api/getaddressutxos/" + encodedAddress
  );
  const { data, error } = useFetch("/api/addresses/" + encodedAddress);
  const xnaUsdRate = useNeuraiUSD();

  if (error) {
    return (
      <MyCard
        header="Address"
        body={"Could not load " + address + ": " + error}
      />
    );
  }
  if (!data) {
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
        assets={data.assets}
      />
      <Spacer></Spacer>

      <MyCard header="History" body={<History address={address} />} />

      <Spacer></Spacer>
      <MyCard
        header={header}
        body={
          <Unspent address={address} unspent={unspent} error={unspentError} />
        }
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
  balance: Amount;
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
