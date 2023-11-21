import * as React from "react";
import { getParam } from "../getParam";

import { MyCard } from "../MyCard";
import { Spacer } from "@nextui-org/react";
import { useConfig } from "../useConfig";
import { Inputs } from "./Inputs";
import { useTransaction } from "./useTransaction";
import { TransactionDetails } from "./TransactionDetails";
import { Outputs } from "./Outputs";

export function Transaction() {
  const id = "" + getParam("id");
  const transaction = useTransaction(id);
  const config = useConfig();

  if (!transaction) {
    return null;
  }

  const text = JSON.stringify(transaction, null, 4);

  return (
    <>
      <MyCard header="Transaction id" body={id} />
      <Spacer />
      <TransactionDetails config={config} transaction={transaction} />
      <Spacer />
      <MyCard header="Inputs" body={<Inputs transaction={transaction} />} />
      <Spacer />
      <MyCard header="Outputs" body={<Outputs transaction={transaction} />} />
      <Spacer />
      <MyCard header={"Raw transaction data"} body={<pre>{text}</pre>} />
    </>
  );
}
