import * as React from "react";
const numberConverter = require("number-to-words");
import { Loading } from "@nextui-org/react";
import { MyCard } from "../MyCard";

export function Unspent({ address, unspent }) {
  if (!unspent) {
    return (
      <>
        <Loading />
      </>
    );
  }
  if (unspent.length > 100) {
    const URL = "/api/getaddressutxos/" + address;
    return (
      <div>
        <a target="_blank" href={URL}>
          {unspent.length.toLocaleString()} unspent
        </a>
      </div>
    );
  }
  unspent = unspent.map((u) => {
    u.value = u.satoshis / 100000000;
    u.text = numberConverter.toWords(u.value);
    return u;
  });
  if (unspent.length > 100) {
    const text = JSON.stringify(unspent, null, 4);
    return <pre>{text}</pre>;
  }

  const body = (
    <ol>
      {unspent.map((u) => {
        const k = u.txid + " " + u.outputIndex;
        return (
          <li key={k}>
            <pre>{JSON.stringify(u, null, 4)}</pre>
          </li>
        );
      })}
    </ol>
  );

  return <MyCard header="Unspent transaction outputs (UTXO" body={body} />;
}
