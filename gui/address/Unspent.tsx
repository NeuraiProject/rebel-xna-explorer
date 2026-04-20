import * as React from "react";
import { Loading } from "../components";
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
  const body = (
    <ol>
      {unspent.map((u) => {
        const k = u.txid + " " + u.outputIndex;
        return (
          <li key={k} style={{ marginBottom: 4 }}>
            <pre>{JSON.stringify(u, null, 4)}</pre>
          </li>
        );
      })}
    </ol>
  );

  return <MyCard header="Unspent transaction outputs (UTXO" body={body} />;
}
