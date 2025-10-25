import * as React from "react";
import { getParam } from "./getParam";
import axios from "axios";

import { Badge, Spacer } from "./components";
import { MyCard } from "./MyCard";

export function Block() {
  const hash = getParam("hash");
  const [data, setData] = React.useState(null);
  React.useEffect(() => {
    const URL = "/api/blocks/" + hash;
    async function work() {
      const asdf = await axios.get(URL);
      delete asdf.data.type;
      delete asdf.data._rev;
      delete asdf.data._id;
      delete asdf.data.hex;
      setData(asdf.data);
    }
    work();
  }, []);

  if (!data) {
    return null;
  }

  return (
    <>
      <MyCard header={"Block"} body={hash} />

      <Spacer y={1}></Spacer>

      <Transactions block={data} />

      <Spacer y={2} />
      <Raw block={data} />
    </>
  );
}

function Transactions({ block }) {
  if (!block) {
    return null;
  }
  const transactionIds = block.tx;

  if (!transactionIds || transactionIds.length === 0) {
    return null;
  }

  const header = (
    <>
      Transactions{" "}
      <div
        style={{
          top: "-7px",
          display: "inline-block",
          position: "relative",
        }}
      >
        <Badge size="md"> {transactionIds.length}</Badge>
      </div>
    </>
  );

  const body = (
    <ol>
      {transactionIds.map(function (t) {
        //OK this can be a string, that is tx-id
        //OR an transaction Object
        if (t.txid) {
          t = t.txid;
        }
        const URL = "index.html?route=TRANSACTION&id=" + t;

        return (
          <li key={t}>
            <a href={URL} className="card-link">
              <small>{t}</small>
            </a>
          </li>
        );
      })}
    </ol>
  );
  return <MyCard header={header} body={body} />;
}

function Raw({ block }) {
  const text = JSON.stringify(block, null, 4);

  const body = <pre>{text}</pre>;
  return <MyCard header="Raw block data" body={body} />;
}
